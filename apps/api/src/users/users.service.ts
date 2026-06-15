import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import { RequestUser } from '../auth/request-user.type';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisation: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User was not found.');
    }

    return this.toSafeUser(user);
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisation: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User was not found.');
    }

    return this.toSafeUser(user);
  }

  async listUsers(filters: {
    page?: number;
    limit?: number;
    role?: UserRole;
    status?: UserStatus;
    organisationId?: string;
    search?: string;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.organisationId
        ? { organisationId: filters.organisationId }
        : {}),
      ...(filters.search
        ? {
            OR: [
              {
                email: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          organisation: true,
        },
      }),
    ]);

    return {
      data: data.map((user) => this.toSafeUser(user)),
      meta: {
        page,
        limit,
        total,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  getUsersByRole(role: UserRole) {
    return this.prisma.user.findMany({
      where: { role },
      include: { organisation: true },
      omit: {
        passwordHash: true,
      },
    });
  }

  async getUsersByOrganisation(
    organisationId: string,
    filters: {
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where = { organisationId };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          organisation: true,
        },
      }),
    ]);

    return {
      data: data.map((user) => this.toSafeUser(user)),
      meta: {
        page,
        limit,
        total,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async updateUserName(userId: string, name: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    await this.auditService.record({
      action: 'USER_PROFILE_UPDATED',
      userId,
      entityType: 'User',
      entityId: user.id,
      metadata: {
        name: user.name,
      },
    });

    return this.toSafeUser(user);
  }

  async updateUserRole(input: {
    actor: RequestUser;
    userId: string;
    role: UserRole;
  }) {
    const targetUser = await this.getExistingUser(input.userId);

    if (targetUser.role === UserRole.PLATFORM_ADMIN) {
      await this.assertNotRemovingLastActivePlatformAdmin({
        targetUserId: targetUser.id,
        nextRole: input.role,
        nextStatus: targetUser.status,
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        role: input.role,
      },
      include: {
        organisation: true,
      },
    });

    await this.auditService.record({
      action: 'USER_ROLE_UPDATED',
      userId: input.actor.id,
      entityType: 'User',
      entityId: updatedUser.id,
      metadata: {
        targetUserId: updatedUser.id,
        previousRole: targetUser.role,
        nextRole: updatedUser.role,
      },
    });

    return this.toSafeUser(updatedUser);
  }

  async updateUserStatus(input: {
    actor: RequestUser;
    userId: string;
    status: UserStatus;
  }) {
    const targetUser = await this.getExistingUser(input.userId);

    if (
      targetUser.id === input.actor.id &&
      input.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Platform admins cannot suspend or disable their own account.',
      );
    }

    if (targetUser.role === UserRole.PLATFORM_ADMIN) {
      await this.assertNotRemovingLastActivePlatformAdmin({
        targetUserId: targetUser.id,
        nextRole: targetUser.role,
        nextStatus: input.status,
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        status: input.status,
      },
      include: {
        organisation: true,
      },
    });

    if (input.status !== UserStatus.ACTIVE) {
      await this.prisma.authSession.updateMany({
        where: {
          userId: updatedUser.id,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedReason: `ACCOUNT_${input.status}`,
        },
      });
    }

    await this.auditService.record({
      action: 'USER_STATUS_UPDATED',
      userId: input.actor.id,
      entityType: 'User',
      entityId: updatedUser.id,
      metadata: {
        targetUserId: updatedUser.id,
        previousStatus: targetUser.status,
        nextStatus: updatedUser.status,
      },
    });

    return this.toSafeUser(updatedUser);
  }

  async updateUserOrganisation(input: {
    actor: RequestUser;
    userId: string;
    organisationId: string | null;
  }) {
    const targetUser = await this.getExistingUser(input.userId);
    const nextOrganisationId =
      input.organisationId && input.organisationId.trim().length > 0
        ? input.organisationId.trim()
        : null;

    if (nextOrganisationId) {
      const organisation = await this.prisma.organisation.findUnique({
        where: {
          id: nextOrganisationId,
        },
        select: {
          id: true,
        },
      });

      if (!organisation) {
        throw new NotFoundException('Organisation was not found.');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        organisationId: nextOrganisationId,
      },
      include: {
        organisation: true,
      },
    });

    await this.auditService.record({
      action: 'USER_ORGANISATION_UPDATED',
      userId: input.actor.id,
      entityType: 'User',
      entityId: updatedUser.id,
      metadata: {
        targetUserId: updatedUser.id,
        previousOrganisationId: targetUser.organisationId,
        nextOrganisationId: updatedUser.organisationId,
      },
    });

    return this.toSafeUser(updatedUser);
  }

  private async getExistingUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User was not found.');
    }

    return user;
  }

  private async assertNotRemovingLastActivePlatformAdmin(input: {
    targetUserId: string;
    nextRole: UserRole;
    nextStatus: UserStatus;
  }) {
    const wouldRemainActivePlatformAdmin =
      input.nextRole === UserRole.PLATFORM_ADMIN &&
      input.nextStatus === UserStatus.ACTIVE;

    if (wouldRemainActivePlatformAdmin) {
      return;
    }

    const activePlatformAdminCount = await this.prisma.user.count({
      where: {
        role: UserRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
        id: {
          not: input.targetUserId,
        },
      },
    });

    if (activePlatformAdminCount === 0) {
      throw new BadRequestException(
        'At least one active platform admin must remain.',
      );
    }
  }

  private toSafeUser<T extends User & { organisation?: unknown }>(user: T) {
    const { passwordHash, ...safeUser } = user;

    void passwordHash;

    return safeUser as Omit<T, 'passwordHash'>;
  }
}
