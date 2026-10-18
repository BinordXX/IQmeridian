import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import {
  AuthSessionStatus,
  Prisma,
  User,
  UserRole,
  UserStatus,
} from '@prisma/client';
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

  async permanentlyDeleteUser(input: {
    actor: RequestUser;
    userId: string;
    confirmationEmail: string;
  }) {
    if (!this.isSuperAdmin(input.actor)) {
      throw new ForbiddenException(
        'Only super admins can permanently purge user accounts.',
      );
    }

    const targetUser = await this.getExistingUser(input.userId);

    if (targetUser.id === input.actor.id) {
      throw new BadRequestException(
        'Super admins cannot permanently purge their own signed-in account.',
      );
    }

    const confirmationEmail = input.confirmationEmail.trim().toLowerCase();
    const targetEmail = targetUser.email.trim().toLowerCase();

    if (confirmationEmail !== targetEmail) {
      throw new BadRequestException(
        'Confirmation email does not match the target user.',
      );
    }

    if (targetUser.role === UserRole.SUPER_ADMIN) {
      await this.assertNotRemovingLastActiveSuperAdmin({
        targetUserId: targetUser.id,
        nextRole: targetUser.role,
        nextStatus: UserStatus.DISABLED,
      });
    }

    const purgeResult = await this.prisma.$transaction(async (tx) => {
      const participantRecords = await tx.organisationParticipant.findMany({
        where: {
          userId: targetUser.id,
        },
        select: {
          id: true,
        },
      });

      const participantIds = participantRecords.map(
        (participant) => participant.id,
      );

      const candidateInvitations = await tx.invitation.findMany({
        where: {
          OR: [
            {
              candidateUserId: targetUser.id,
            },
            {
              email: {
                equals: targetUser.email,
                mode: 'insensitive',
              },
            },
            ...(participantIds.length > 0
              ? [
                  {
                    participantId: {
                      in: participantIds,
                    },
                  },
                ]
              : []),
          ],
        },
        select: {
          id: true,
        },
      });

      const candidateInvitationIds = candidateInvitations.map(
        (invitation) => invitation.id,
      );

      const deletedReports = await tx.report.deleteMany({
        where: {
          subjectUserId: targetUser.id,
        },
      });

      const deletedSessions = await tx.session.deleteMany({
        where: {
          OR: [
            {
              userId: targetUser.id,
            },
            {
              applicantEmail: {
                equals: targetUser.email,
                mode: 'insensitive',
              },
            },
            ...(participantIds.length > 0
              ? [
                  {
                    participantId: {
                      in: participantIds,
                    },
                  },
                ]
              : []),
            ...(candidateInvitationIds.length > 0
              ? [
                  {
                    invitationId: {
                      in: candidateInvitationIds,
                    },
                  },
                ]
              : []),
          ],
        },
      });

      const deletedCandidateInvitations = await tx.invitation.deleteMany({
        where: {
          OR: [
            {
              candidateUserId: targetUser.id,
            },
            {
              email: {
                equals: targetUser.email,
                mode: 'insensitive',
              },
            },
            ...(participantIds.length > 0
              ? [
                  {
                    participantId: {
                      in: participantIds,
                    },
                  },
                ]
              : []),
          ],
        },
      });

      const deletedOrganisationAdminInvitations =
        await tx.organisationAdminInvitation.deleteMany({
          where: {
            email: {
              equals: targetUser.email,
              mode: 'insensitive',
            },
          },
        });

      const deletedVerificationTokens = await tx.verificationToken.deleteMany({
        where: {
          OR: [
            {
              subjectUserId: targetUser.id,
            },
            {
              email: {
                equals: targetUser.email,
                mode: 'insensitive',
              },
            },
          ],
        },
      });

      const deletedExportRequests = await tx.analyticsExportRequest.deleteMany({
        where: {
          requestedById: targetUser.id,
        },
      });

      await tx.analyticsExportRequest.updateMany({
        where: {
          reviewedById: targetUser.id,
        },
        data: {
          reviewedById: null,
        },
      });

      await tx.organisationAccessRequest.updateMany({
        where: {
          reviewedById: targetUser.id,
        },
        data: {
          reviewedById: null,
        },
      });

      await tx.campaign.updateMany({
        where: {
          ownerId: targetUser.id,
        },
        data: {
          ownerId: null,
        },
      });

      const deletedResearchAssignments =
        await tx.assessmentFormSectionResearcherAssignment.deleteMany({
          where: {
            researcherId: targetUser.id,
          },
        });

      const deletedAuditLogs = await tx.auditLog.deleteMany({
        where: {
          OR: [
            {
              userId: targetUser.id,
            },
            {
              entityId: targetUser.id,
            },
          ],
        },
      });

      const deletedMemberships = await tx.organisationMembership.deleteMany({
        where: {
          userId: targetUser.id,
        },
      });

      const deletedParticipants = await tx.organisationParticipant.deleteMany({
        where: {
          userId: targetUser.id,
        },
      });

      const deletedAuthSessions = await tx.authSession.deleteMany({
        where: {
          userId: targetUser.id,
        },
      });

      const deletedAuthAccounts = await tx.authAccount.deleteMany({
        where: {
          userId: targetUser.id,
        },
      });

      const deletedNotificationPreferences =
        await tx.accountNotificationPreference.deleteMany({
          where: {
            userId: targetUser.id,
          },
        });

      const deletedUser = await tx.user.delete({
        where: {
          id: targetUser.id,
        },
      });

      return {
        deletedUser,
        purgedRecords: {
          reports: deletedReports.count,
          sessions: deletedSessions.count,
          candidateInvitations: deletedCandidateInvitations.count,
          organisationAdminInvitations:
            deletedOrganisationAdminInvitations.count,
          verificationTokens: deletedVerificationTokens.count,
          exportRequests: deletedExportRequests.count,
          researchAssignments: deletedResearchAssignments.count,
          auditLogs: deletedAuditLogs.count,
          organisationMemberships: deletedMemberships.count,
          organisationParticipants: deletedParticipants.count,
          authSessions: deletedAuthSessions.count,
          authAccounts: deletedAuthAccounts.count,
          notificationPreferences: deletedNotificationPreferences.count,
        },
      };
    });

    await this.auditService.record({
      action: 'USER_PERMANENTLY_PURGED',
      userId: input.actor.id,
      entityType: 'Governance',
      entityId: null,
      metadata: {
        deletedRole: purgeResult.deletedUser.role,
        deletedStatus: purgeResult.deletedUser.status,
        purgedAt: new Date().toISOString(),
      },
    });

    return {
      status: 'deleted',
      deletedUser: {
        id: purgeResult.deletedUser.id,
        email: purgeResult.deletedUser.email,
        name: purgeResult.deletedUser.name,
        role: purgeResult.deletedUser.role,
        status: purgeResult.deletedUser.status,
      },
      purgedRecords: purgeResult.purgedRecords,
    };
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

  async getSuperAdminOverview() {
    const adminRoles: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.PLATFORM_ADMIN,
    ];

    const [
      totalSuperAdmins,
      activeSuperAdmins,
      totalPlatformAdmins,
      inactiveAdminAccounts,
      activePrivilegedSessions,
      recentPrivilegedAudit,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({
        where: {
          role: UserRole.SUPER_ADMIN,
        },
      }),
      this.prisma.user.count({
        where: {
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      }),
      this.prisma.user.count({
        where: {
          role: UserRole.PLATFORM_ADMIN,
        },
      }),
      this.prisma.user.count({
        where: {
          role: {
            in: adminRoles,
          },
          status: {
            not: UserStatus.ACTIVE,
          },
        },
      }),
      this.prisma.authSession.count({
        where: {
          status: AuthSessionStatus.ACTIVE,
          user: {
            role: {
              in: adminRoles,
            },
          },
        },
      }),
      this.prisma.auditLog.findMany({
        where: {
          OR: [
            {
              user: {
                is: {
                  role: {
                    in: adminRoles,
                  },
                },
              },
            },
            {
              action: {
                in: [
                  'SUPER_ADMIN_BOOTSTRAPPED',
                  'SUPER_ADMIN_PASSWORD_RESET_BY_BREAK_GLASS',
                  'SUPER_ADMIN_ADMIN_SESSIONS_REVOKED',
                  'USER_CREATED_BY_PLATFORM_ADMIN',
                  'USER_ROLE_UPDATED',
                  'USER_STATUS_UPDATED',
                ],
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 12,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      totalSuperAdmins,
      activeSuperAdmins,
      totalPlatformAdmins,
      inactiveAdminAccounts,
      activePrivilegedSessions,
      recentPrivilegedAudit,
    };
  }

  async listAdminLevelUsers() {
    const adminRoles: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.PLATFORM_ADMIN,
    ];

    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: adminRoles,
        },
      },
      orderBy: [
        {
          role: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            authSessions: {
              where: {
                status: AuthSessionStatus.ACTIVE,
              },
            },
          },
        },
      },
    });

    return users.map(({ _count, ...user }) => ({
      ...user,
      emailVerified: Boolean(user.emailVerifiedAt),
      activeSessionCount: _count.authSessions,
    }));
  }

  async revokeAdminSessions(input: { actor: RequestUser; userId: string }) {
    if (!this.isSuperAdmin(input.actor)) {
      throw new BadRequestException(
        'Only super admins can revoke administrator sessions.',
      );
    }

    const targetUser = await this.getExistingUser(input.userId);

    if (
      targetUser.role !== UserRole.SUPER_ADMIN &&
      targetUser.role !== UserRole.PLATFORM_ADMIN
    ) {
      throw new BadRequestException(
        'Session revocation from this surface is limited to administrator accounts.',
      );
    }

    this.assertActorCanManageTargetUser(input.actor, targetUser);

    if (targetUser.id === input.actor.id) {
      throw new BadRequestException(
        'Super admins cannot revoke their own sessions from the privileged admin-management surface.',
      );
    }

    const revokedAt = new Date();

    const result = await this.prisma.authSession.updateMany({
      where: {
        userId: targetUser.id,
        status: AuthSessionStatus.ACTIVE,
      },
      data: {
        status: AuthSessionStatus.REVOKED,
        revokedAt,
        revokedReason: 'SUPER_ADMIN_REVOKED',
      },
    });

    await this.auditService.record({
      action: 'SUPER_ADMIN_ADMIN_SESSIONS_REVOKED',
      userId: input.actor.id,
      entityType: 'User',
      entityId: targetUser.id,
      metadata: {
        targetUserId: targetUser.id,
        targetRole: targetUser.role,
        revokedSessionCount: result.count,
      },
    });

    return {
      userId: targetUser.id,
      revokedSessionCount: result.count,
      revokedAt,
    };
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
