import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthSessionStatus,
  Prisma,
  User,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PasswordService } from '../auth/password.service';
import { RequestUser } from '../auth/request-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateAccountNotificationPreferencesDto } from './dto/update-account-notification-preferences.dto';
import { UpdateAccountProfileDto } from './dto/update-account-profile.dto';

type SafeAccountUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'name'
  | 'role'
  | 'status'
  | 'organisationId'
  | 'emailVerifiedAt'
  | 'lastLoginAt'
  | 'createdAt'
  | 'updatedAt'
  | 'deletionRequestedAt'
  | 'deletedAt'
>;

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async getProfile(user: RequestUser) {
    const account = await this.getActiveAccount(user.id);
    const notificationPreferences =
      await this.getOrCreateNotificationPreferences(user.id);

    const [activeSessionCount, assessmentSessionCount] =
      await this.prisma.$transaction([
        this.prisma.authSession.count({
          where: {
            userId: user.id,
            status: AuthSessionStatus.ACTIVE,
            expiresAt: {
              gt: new Date(),
            },
          },
        }),
        this.prisma.session.count({
          where: {
            userId: user.id,
          },
        }),
      ]);

    return {
      user: this.toSafeAccountUser(account),
      notificationPreferences,
      accountStats: {
        activeSessionCount,
        assessmentSessionCount,
      },
    };
  }

  async updateProfile(user: RequestUser, dto: UpdateAccountProfileDto) {
    const existingAccount = await this.getActiveAccount(user.id);
    const name = dto.name.trim();

    if (name.length < 2) {
      throw new BadRequestException('Name must be at least 2 characters.');
    }

    const updatedAccount = await this.prisma.user.update({
      where: {
        id: existingAccount.id,
      },
      data: {
        name,
      },
    });

    await this.recordAudit('account.profile_updated', user.id, {
      previousName: existingAccount.name,
      nextName: updatedAccount.name,
    });

    return {
      user: this.toSafeAccountUser(updatedAccount),
      message: 'Profile updated successfully.',
    };
  }

  async getNotificationPreferences(user: RequestUser) {
    await this.getActiveAccount(user.id);

    return this.getOrCreateNotificationPreferences(user.id);
  }

  async updateNotificationPreferences(
    user: RequestUser,
    dto: UpdateAccountNotificationPreferencesDto,
  ) {
    await this.getActiveAccount(user.id);

    const preferences = await this.prisma.accountNotificationPreference.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        securityAlerts: dto.securityAlerts ?? true,
        assessmentReminders: dto.assessmentReminders ?? true,
        productUpdates: dto.productUpdates ?? false,
        researchGovernanceUpdates: dto.researchGovernanceUpdates ?? false,
      },
      update: {
        ...(dto.securityAlerts === undefined
          ? {}
          : { securityAlerts: dto.securityAlerts }),
        ...(dto.assessmentReminders === undefined
          ? {}
          : { assessmentReminders: dto.assessmentReminders }),
        ...(dto.productUpdates === undefined
          ? {}
          : { productUpdates: dto.productUpdates }),
        ...(dto.researchGovernanceUpdates === undefined
          ? {}
          : { researchGovernanceUpdates: dto.researchGovernanceUpdates }),
      },
    });

    await this.recordAudit('account.notification_preferences_updated', user.id, {
      securityAlerts: preferences.securityAlerts,
      assessmentReminders: preferences.assessmentReminders,
      productUpdates: preferences.productUpdates,
      researchGovernanceUpdates: preferences.researchGovernanceUpdates,
    });

    return {
      preferences,
      message: 'Notification preferences updated successfully.',
    };
  }

  async listAuthSessions(user: RequestUser) {
    await this.getActiveAccount(user.id);

    const sessions = await this.prisma.authSession.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        revokedReason: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 25,
    });

    return {
      items: sessions.map((session) => ({
        ...session,
        isCurrent: session.id === user.authSessionId,
      })),
    };
  }

  async revokeAuthSession(user: RequestUser, sessionId: string) {
    await this.getActiveAccount(user.id);

    if (sessionId === user.authSessionId) {
      throw new BadRequestException(
        'Use sign out to revoke the current session.',
      );
    }

    const existingSession = await this.prisma.authSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingSession) {
      throw new NotFoundException('Session was not found.');
    }

    if (existingSession.status !== AuthSessionStatus.ACTIVE) {
      return {
        status: 'ok',
        message: 'Session is already inactive.',
      };
    }

    await this.prisma.authSession.update({
      where: {
        id: sessionId,
      },
      data: {
        status: AuthSessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: 'USER_REVOKED_SESSION',
      },
    });

    await this.recordAudit('account.session_revoked', user.id, {
      authSessionId: sessionId,
    });

    return {
      status: 'ok',
      message: 'Session revoked successfully.',
    };
  }

  async revokeOtherAuthSessions(user: RequestUser) {
    await this.getActiveAccount(user.id);

    const result = await this.prisma.authSession.updateMany({
      where: {
        userId: user.id,
        status: AuthSessionStatus.ACTIVE,
        id: {
          not: user.authSessionId,
        },
      },
      data: {
        status: AuthSessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: 'USER_REVOKED_OTHER_SESSIONS',
      },
    });

    await this.recordAudit('account.other_sessions_revoked', user.id, {
      revokedCount: result.count,
      currentAuthSessionId: user.authSessionId,
    });

    return {
      status: 'ok',
      revokedCount: result.count,
      message: 'Other active sessions revoked successfully.',
    };
  }

  async deleteAccount(user: RequestUser, dto: DeleteAccountDto) {
    const account = await this.getActiveAccountWithPassword(user.id);

    if (account.role === UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException(
        'Platform administrators cannot delete their own account from account settings.',
      );
    }

    if (!account.passwordHash) {
      throw new BadRequestException(
        'This account does not currently have a local password.',
      );
    }

    const passwordIsValid = await this.passwordService.verifyPassword(
      dto.password,
      account.passwordHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Password is incorrect.');
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: account.id,
        },
        data: {
          name: null,
          passwordHash: null,
          status: UserStatus.DISABLED,
          deletionRequestedAt: now,
          deletedAt: now,
        },
      }),
      this.prisma.authSession.updateMany({
        where: {
          userId: account.id,
          status: AuthSessionStatus.ACTIVE,
        },
        data: {
          status: AuthSessionStatus.REVOKED,
          revokedAt: now,
          revokedReason: 'ACCOUNT_DELETION_REQUESTED',
        },
      }),
    ]);

    await this.recordAudit('account.deleted', account.id, {
      previousStatus: account.status,
      nextStatus: UserStatus.DISABLED,
      deletedAt: now,
    });

    return {
      status: 'ok',
      message: 'Account disabled successfully.',
    };
  }

  private async getActiveAccount(userId: string) {
    const account = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!account) {
      throw new UnauthorizedException('Authenticated user was not found.');
    }

    if (account.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active.');
    }

    return account;
  }

  private async getActiveAccountWithPassword(userId: string) {
    const account = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!account) {
      throw new UnauthorizedException('Authenticated user was not found.');
    }

    if (account.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active.');
    }

    return account;
  }

  private async getOrCreateNotificationPreferences(userId: string) {
    return this.prisma.accountNotificationPreference.upsert({
      where: {
        userId,
      },
      create: {
        userId,
      },
      update: {},
    });
  }

  private toSafeAccountUser(
    user: SafeAccountUser & {
      organisation?: {
        id: string;
        name: string;
      } | null;
    },
  ) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      organisationId: user.organisationId,
      organisation: user.organisation ?? null,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletionRequestedAt: user.deletionRequestedAt,
      deletedAt: user.deletedAt,
    };
  }

  private async recordAudit(
    action: string,
    userId: string,
    metadata: unknown,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        userId,
        entityType: 'ACCOUNT',
        entityId: userId,
        metadata: this.toJsonValue(metadata),
      },
    });
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}