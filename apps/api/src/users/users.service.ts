import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import { RequestUser } from '../auth/request-user.type';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly passwordService: PasswordService,
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

  async createManagedUser(input: {
    actor: RequestUser;
    input: CreateManagedUserDto;
  }) {
    const email = input.input.email.trim().toLowerCase();
    const name = input.input.name?.trim() || null;
    const role = input.input.role;
    const status = input.input.status ?? UserStatus.ACTIVE;

    this.assertActorCanAssignRole(input.actor, role);

    const organisationId =
      input.input.organisationId && input.input.organisationId.trim().length > 0
        ? input.input.organisationId.trim()
        : null;

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    if (role === UserRole.EMPLOYER_ADMIN && !organisationId) {
      throw new BadRequestException(
        'Employer admins must be attached to an organisation.',
      );
    }

    if (organisationId) {
      const organisation = await this.prisma.organisation.findUnique({
        where: {
          id: organisationId,
        },
        select: {
          id: true,
        },
      });

      if (!organisation) {
        throw new NotFoundException('Organisation was not found.');
      }
    }

    const passwordHash = await this.passwordService.hashPassword(
      input.input.password,
    );

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        role,
        status,
        organisationId,
        passwordHash,
      },
      include: {
        organisation: true,
      },
    });

    await this.auditService.record({
      action: 'USER_CREATED_BY_PLATFORM_ADMIN',
      userId: input.actor.id,
      entityType: 'User',
      entityId: user.id,
      metadata: {
        targetUserId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        organisationId: user.organisationId,
      },
    });

    return this.toSafeUser(user);
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

    this.assertActorCanManageTargetUser(input.actor, targetUser);
    this.assertActorCanAssignRole(input.actor, input.role);

    if (input.role === UserRole.EMPLOYER_ADMIN && !targetUser.organisationId) {
      throw new BadRequestException(
        'Employer admins must be attached to an organisation before the role is assigned.',
      );
    }

    if (targetUser.role === UserRole.SUPER_ADMIN) {
      await this.assertNotRemovingLastActiveSuperAdmin({
        targetUserId: targetUser.id,
        nextRole: input.role,
        nextStatus: targetUser.status,
      });
    }

    if (
      targetUser.role === UserRole.PLATFORM_ADMIN ||
      targetUser.role === UserRole.SUPER_ADMIN
    ) {
      await this.assertNotRemovingLastActiveAdminLevelUser({
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

    this.assertActorCanManageTargetUser(input.actor, targetUser);

    if (
      targetUser.id === input.actor.id &&
      input.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Admins cannot suspend or disable their own account.',
      );
    }

    if (targetUser.role === UserRole.SUPER_ADMIN) {
      await this.assertNotRemovingLastActiveSuperAdmin({
        targetUserId: targetUser.id,
        nextRole: targetUser.role,
        nextStatus: input.status,
      });
    }

    if (
      targetUser.role === UserRole.PLATFORM_ADMIN ||
      targetUser.role === UserRole.SUPER_ADMIN
    ) {
      await this.assertNotRemovingLastActiveAdminLevelUser({
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

    this.assertActorCanManageTargetUser(input.actor, targetUser);

    const nextOrganisationId =
      input.organisationId && input.organisationId.trim().length > 0
        ? input.organisationId.trim()
        : null;

    if (targetUser.role === UserRole.EMPLOYER_ADMIN && !nextOrganisationId) {
      throw new BadRequestException(
        'Employer admins must remain attached to an organisation.',
      );
    }

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

  private isSuperAdmin(actor: RequestUser) {
    return actor.role === UserRole.SUPER_ADMIN;
  }

  private assertActorCanAssignRole(actor: RequestUser, role: UserRole) {
    if (role === UserRole.SUPER_ADMIN || role === UserRole.PLATFORM_ADMIN) {
      if (!this.isSuperAdmin(actor)) {
        throw new BadRequestException(
          'Only super admins can create or assign admin-level roles.',
        );
      }
    }
  }

  private assertActorCanManageTargetUser(actor: RequestUser, targetUser: User) {
    if (targetUser.id === actor.id) {
      return;
    }

    if (
      targetUser.role === UserRole.SUPER_ADMIN ||
      targetUser.role === UserRole.PLATFORM_ADMIN
    ) {
      if (!this.isSuperAdmin(actor)) {
        throw new BadRequestException(
          'Only super admins can manage admin-level accounts.',
        );
      }
    }
  }

  private async assertNotRemovingLastActiveSuperAdmin(input: {
    targetUserId: string;
    nextRole: UserRole;
    nextStatus: UserStatus;
  }) {
    const wouldRemainActiveSuperAdmin =
      input.nextRole === UserRole.SUPER_ADMIN &&
      input.nextStatus === UserStatus.ACTIVE;

    if (wouldRemainActiveSuperAdmin) {
      return;
    }

    const activeSuperAdminCount = await this.prisma.user.count({
      where: {
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        id: {
          not: input.targetUserId,
        },
      },
    });

    if (activeSuperAdminCount === 0) {
      throw new BadRequestException(
        'At least one active super admin must remain.',
      );
    }
  }

  private async assertNotRemovingLastActiveAdminLevelUser(input: {
    targetUserId: string;
    nextRole: UserRole;
    nextStatus: UserStatus;
  }) {
    const wouldRemainActiveAdminLevelUser =
      (input.nextRole === UserRole.SUPER_ADMIN ||
        input.nextRole === UserRole.PLATFORM_ADMIN) &&
      input.nextStatus === UserStatus.ACTIVE;

    if (wouldRemainActiveAdminLevelUser) {
      return;
    }

    const activeAdminLevelUserCount = await this.prisma.user.count({
      where: {
        role: {
          in: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN],
        },
        status: UserStatus.ACTIVE,
        id: {
          not: input.targetUserId,
        },
      },
    });

    if (activeAdminLevelUserCount === 0) {
      throw new BadRequestException(
        'At least one active admin-level account must remain.',
      );
    }
  }

  private toSafeUser<T extends User & { organisation?: unknown }>(user: T) {
    const { passwordHash, ...safeUser } = user;

    void passwordHash;

    return safeUser as Omit<T, 'passwordHash'>;
  }
}
