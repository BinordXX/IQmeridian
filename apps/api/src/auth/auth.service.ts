import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  AuthProvider,
  AuthRateLimitAction,
  AuthSession,
  AuthSessionStatus,
  InvitationStatus,
  Prisma,
  User,
  UserRole,
  UserStatus,
  OrganisationAdminInvitationStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuthThrottleService } from './auth-throttle.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { AcceptOrganisationAdminInvitationDto } from './dto/accept-organisation-admin-invitation.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { RequestUser } from './request-user.type';
import { TokenService } from './token.service';

type RequestMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  organisationId: string | null;
  organisationName: string | null;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AuthResponse = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly authThrottleService: AuthThrottleService,
  ) {}

    async getOrganisationAdminInvitationByToken(token: string) {
    const invitation = await this.prisma.organisationAdminInvitation.findUnique({
      where: {
        token,
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

    if (!invitation) {
      throw new BadRequestException('Employer admin invitation token is invalid.');
    }

    if (
      invitation.status === OrganisationAdminInvitationStatus.PENDING &&
      invitation.expiresAt < new Date()
    ) {
      const expiredInvitation =
        await this.prisma.organisationAdminInvitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            status: OrganisationAdminInvitationStatus.EXPIRED,
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

      await this.recordAudit('auth.organisation_admin_invitation_expired', null, {
        invitationId: expiredInvitation.id,
        organisationId: expiredInvitation.organisationId,
        email: expiredInvitation.email,
      });

      return {
        id: expiredInvitation.id,
        email: expiredInvitation.email,
        role: expiredInvitation.role,
        status: expiredInvitation.status,
        expiresAt: expiredInvitation.expiresAt,
        organisation: expiredInvitation.organisation,
      };
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organisation: invitation.organisation,
    };
  }

    async acceptOrganisationAdminInvitation(
    token: string,
    dto: AcceptOrganisationAdminInvitationDto,
    metadata: RequestMetadata,
  ): Promise<AuthResponse> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match.');
    }

    const invitation = await this.prisma.organisationAdminInvitation.findUnique({
      where: {
        token,
      },
      include: {
        organisation: true,
      },
    });

    if (!invitation) {
      throw new BadRequestException('Employer admin invitation token is invalid.');
    }

    const email = this.normaliseEmail(invitation.email);
    const throttleIdentifier = this.buildThrottleIdentifier({
      action: 'accept-organisation-admin-invitation',
      metadata,
      email,
    });

    await this.authThrottleService.assertAllowed({
      action: AuthRateLimitAction.REGISTER,
      identifier: throttleIdentifier,
      maxAttempts: 5,
      windowSeconds: 15 * 60,
    });

    try {
      if (invitation.status !== OrganisationAdminInvitationStatus.PENDING) {
        throw new BadRequestException('Employer admin invitation is no longer available.');
      }

      if (invitation.expiresAt < new Date()) {
        const expiredInvitation =
          await this.prisma.organisationAdminInvitation.update({
            where: {
              id: invitation.id,
            },
            data: {
              status: OrganisationAdminInvitationStatus.EXPIRED,
            },
          });

        await this.recordAudit(
          'auth.organisation_admin_invitation_expired',
          null,
          {
            invitationId: expiredInvitation.id,
            organisationId: expiredInvitation.organisationId,
            email: expiredInvitation.email,
          },
        );

        throw new BadRequestException('Employer admin invitation has expired.');
      }

      const existingUser = await this.prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        throw new ConflictException(
          'An account with this email already exists. Sign in or contact platform support before using this invitation.',
        );
      }

      const passwordHash = await this.passwordService.hashPassword(
        dto.password,
      );
      const name = dto.name?.trim() || null;

      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            name,
            role: UserRole.EMPLOYER_ADMIN,
            organisationId: invitation.organisationId,
            passwordHash,
            status: UserStatus.ACTIVE,
          },
        });

        const authAccount = await tx.authAccount.create({
          data: {
            userId: user.id,
            provider: AuthProvider.LOCAL,
            providerAccountId: email,
            email,
          },
        });

        const invitationClaim =
          await tx.organisationAdminInvitation.updateMany({
            where: {
              id: invitation.id,
              status: OrganisationAdminInvitationStatus.PENDING,
              acceptedById: null,
            },
            data: {
              status: OrganisationAdminInvitationStatus.ACCEPTED,
              acceptedById: user.id,
              usedAt: new Date(),
            },
          });

        if (invitationClaim.count !== 1) {
          throw new ConflictException(
            'Employer admin invitation could not be claimed. It may have already been used.',
          );
        }

        return {
          user,
          authAccount,
        };
      });

      await this.recordAudit('auth.accept_organisation_admin_invitation', result.user.id, {
        provider: AuthProvider.LOCAL,
        invitationId: invitation.id,
        organisationId: invitation.organisationId,
        role: result.user.role,
      });

      await this.recordThrottleSuccess({
        action: AuthRateLimitAction.REGISTER,
        identifier: throttleIdentifier,
      });

      return this.createAuthenticatedSession({
        user: result.user,
        authAccountId: result.authAccount.id,
        metadata,
      });
    } catch (error) {
      await this.recordThrottleFailure({
        action: AuthRateLimitAction.REGISTER,
        identifier: throttleIdentifier,
      });

      throw error;
    }
  }

  async register(
    dto: RegisterDto,
    metadata: RequestMetadata,
  ): Promise<AuthResponse> {
    const email = this.normaliseEmail(dto.email);
    const throttleIdentifier = this.buildThrottleIdentifier({
      action: 'register',
      metadata,
      email,
    });

    await this.authThrottleService.assertAllowed({
      action: AuthRateLimitAction.REGISTER,
      identifier: throttleIdentifier,
      maxAttempts: 5,
      windowSeconds: 15 * 60,
    });

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        await this.recordThrottleFailure({
          action: AuthRateLimitAction.REGISTER,
          identifier: throttleIdentifier,
        });

        throw new ConflictException(
          'An account with this email already exists.',
        );
      }

      const passwordHash = await this.passwordService.hashPassword(
        dto.password,
      );
      const name = dto.name?.trim() || null;

      const user = await this.prisma.user.create({
        data: {
          email,
          name,
          role: UserRole.CONSUMER,
          passwordHash,
          status: UserStatus.ACTIVE,
          authAccounts: {
            create: {
              provider: AuthProvider.LOCAL,
              providerAccountId: email,
              email,
            },
          },
        },
        include: {
          authAccounts: {
            where: {
              provider: AuthProvider.LOCAL,
            },
            take: 1,
          },
        },
      });

      await this.recordAudit('auth.register', user.id, {
        provider: AuthProvider.LOCAL,
        role: user.role,
      });

      await this.recordThrottleSuccess({
        action: AuthRateLimitAction.REGISTER,
        identifier: throttleIdentifier,
      });

      return this.createAuthenticatedSession({
        user,
        authAccountId: user.authAccounts[0]?.id ?? null,
        metadata,
      });
    } catch (error) {
      if (!(error instanceof ConflictException)) {
        await this.recordThrottleFailure({
          action: AuthRateLimitAction.REGISTER,
          identifier: throttleIdentifier,
        });
      }

      throw error;
    }
  }

  async registerCandidate(
    dto: RegisterCandidateDto,
    metadata: RequestMetadata,
  ): Promise<AuthResponse> {
    const email = this.normaliseEmail(dto.email);
    const throttleIdentifier = this.buildThrottleIdentifier({
      action: 'register-candidate',
      metadata,
      email,
    });

    await this.authThrottleService.assertAllowed({
      action: AuthRateLimitAction.REGISTER_CANDIDATE,
      identifier: throttleIdentifier,
      maxAttempts: 5,
      windowSeconds: 15 * 60,
    });

    try {
      const invitation = await this.prisma.invitation.findUnique({
        where: {
          token: dto.invitationToken,
        },
        include: {
          campaign: {
            include: {
              assessmentForm: true,
            },
          },
          candidateUser: true,
        },
      });

      if (!invitation) {
        throw new BadRequestException('Invitation token is invalid.');
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException('Invitation is no longer available.');
      }

      if (invitation.candidateUserId) {
        throw new BadRequestException('Invitation is already assigned.');
      }

      if (invitation.expiresAt && invitation.expiresAt < new Date()) {
        const expiredInvitation = await this.prisma.invitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            status: InvitationStatus.EXPIRED,
          },
        });

        await this.recordAudit('auth.candidate_invitation_expired', null, {
          invitationId: expiredInvitation.id,
          campaignId: expiredInvitation.campaignId,
          email: expiredInvitation.email,
        });

        throw new BadRequestException('Invitation has expired.');
      }

      if (this.normaliseEmail(invitation.email) !== email) {
        throw new ForbiddenException(
          'This invitation is assigned to a different email address.',
        );
      }

      if (!invitation.campaign.assessmentFormId) {
        throw new BadRequestException(
          'Campaign has no assessment form assigned.',
        );
      }

      if (!invitation.campaign.assessmentForm) {
        throw new BadRequestException(
          'Campaign assessment form was not found.',
        );
      }

      if (!invitation.campaign.assessmentForm.isActive) {
        throw new BadRequestException(
          'Campaign assessment form is not active.',
        );
      }

      const existingUser = await this.prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        throw new ConflictException(
          'An account with this email already exists. Sign in before using this invitation.',
        );
      }

      const passwordHash = await this.passwordService.hashPassword(
        dto.password,
      );
      const name = dto.name?.trim() || null;

      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            name,
            role: UserRole.CANDIDATE,
            passwordHash,
            status: UserStatus.ACTIVE,
          },
        });

        const authAccount = await tx.authAccount.create({
          data: {
            userId: user.id,
            provider: AuthProvider.LOCAL,
            providerAccountId: email,
            email,
          },
        });

        const invitationClaim = await tx.invitation.updateMany({
          where: {
            id: invitation.id,
            status: InvitationStatus.PENDING,
            candidateUserId: null,
          },
          data: {
            candidateUserId: user.id,
            status: InvitationStatus.ACCEPTED,
            usedAt: new Date(),
          },
        });

        if (invitationClaim.count !== 1) {
          throw new ConflictException(
            'Invitation could not be claimed. It may have already been used.',
          );
        }

        return {
          user,
          authAccount,
        };
      });

      await this.recordAudit('auth.register_candidate', result.user.id, {
        provider: AuthProvider.LOCAL,
        invitationId: invitation.id,
        campaignId: invitation.campaignId,
        role: result.user.role,
      });

      await this.recordThrottleSuccess({
        action: AuthRateLimitAction.REGISTER_CANDIDATE,
        identifier: throttleIdentifier,
      });

      return this.createAuthenticatedSession({
        user: result.user,
        authAccountId: result.authAccount.id,
        metadata,
      });
    } catch (error) {
      await this.recordThrottleFailure({
        action: AuthRateLimitAction.REGISTER_CANDIDATE,
        identifier: throttleIdentifier,
      });

      throw error;
    }
  }

  async login(dto: LoginDto, metadata: RequestMetadata): Promise<AuthResponse> {
    const email = this.normaliseEmail(dto.email);
    const throttleIdentifier = this.buildThrottleIdentifier({
      action: 'login',
      metadata,
      email,
    });

    await this.authThrottleService.assertAllowed({
      action: AuthRateLimitAction.LOGIN,
      identifier: throttleIdentifier,
      maxAttempts: 8,
      windowSeconds: 15 * 60,
    });

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        authAccounts: {
          where: {
            provider: AuthProvider.LOCAL,
          },
          take: 1,
        },
      },
    });

    if (!user?.passwordHash) {
      await this.recordThrottleFailure({
        action: AuthRateLimitAction.LOGIN,
        identifier: throttleIdentifier,
      });

      await this.recordAudit('auth.login_failed', null, {
        provider: AuthProvider.LOCAL,
        email,
        reason: 'USER_NOT_FOUND_OR_NO_LOCAL_PASSWORD',
      });

      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      await this.recordThrottleFailure({
        action: AuthRateLimitAction.LOGIN,
        identifier: throttleIdentifier,
      });

      await this.recordAudit('auth.login_failed', user.id, {
        provider: AuthProvider.LOCAL,
        reason: 'ACCOUNT_NOT_ACTIVE',
        status: user.status,
      });

      throw new ForbiddenException('This account is not active.');
    }

    const passwordIsValid = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      await this.recordThrottleFailure({
        action: AuthRateLimitAction.LOGIN,
        identifier: throttleIdentifier,
      });

      await this.recordAudit('auth.login_failed', user.id, {
        provider: AuthProvider.LOCAL,
        reason: 'INVALID_PASSWORD',
      });

      throw new UnauthorizedException('Invalid email or password.');
    }

    let authAccountId = user.authAccounts[0]?.id ?? null;

    if (!authAccountId) {
      const authAccount = await this.prisma.authAccount.create({
        data: {
          userId: user.id,
          provider: AuthProvider.LOCAL,
          providerAccountId: email,
          email,
        },
      });

      authAccountId = authAccount.id;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    await this.recordAudit('auth.login', updatedUser.id, {
      provider: AuthProvider.LOCAL,
    });

    await this.recordThrottleSuccess({
      action: AuthRateLimitAction.LOGIN,
      identifier: throttleIdentifier,
    });

    return this.createAuthenticatedSession({
      user: updatedUser,
      authAccountId,
      metadata,
    });
  }

  async refresh(
    dto: RefreshTokenDto,
    metadata: RequestMetadata,
  ): Promise<AuthResponse> {
    const refreshTokenHash = this.tokenService.hashRefreshToken(
      dto.refreshToken,
    );
    const throttleIdentifier = this.buildThrottleIdentifier({
      action: 'refresh',
      metadata,
      tokenHash: refreshTokenHash,
    });

    await this.authThrottleService.assertAllowed({
      action: AuthRateLimitAction.REFRESH,
      identifier: throttleIdentifier,
      maxAttempts: 20,
      windowSeconds: 15 * 60,
    });

    const existingSession = await this.prisma.authSession.findUnique({
      where: {
        refreshTokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!existingSession) {
      await this.recordThrottleFailure({
        action: AuthRateLimitAction.REFRESH,
        identifier: throttleIdentifier,
      });

      await this.recordAudit('auth.refresh_failed', null, {
        reason: 'INVALID_REFRESH_TOKEN',
      });

      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (existingSession.status !== AuthSessionStatus.ACTIVE) {
      if (existingSession.revokedReason === 'REFRESH_TOKEN_ROTATED') {
        await this.prisma.authSession.updateMany({
          where: {
            userId: existingSession.userId,
            status: AuthSessionStatus.ACTIVE,
          },
          data: {
            status: AuthSessionStatus.REVOKED,
            revokedAt: new Date(),
            revokedReason: 'REFRESH_TOKEN_REUSE_DETECTED',
          },
        });

        await this.recordAudit(
          'auth.refresh_token_reuse_detected',
          existingSession.userId,
          {
            reusedSessionId: existingSession.id,
          },
        );
      }

      await this.recordThrottleFailure({
        action: AuthRateLimitAction.REFRESH,
        identifier: throttleIdentifier,
      });

      throw new UnauthorizedException('Refresh token is no longer active.');
    }

    if (existingSession.expiresAt <= new Date()) {
      await this.prisma.authSession.update({
        where: {
          id: existingSession.id,
        },
        data: {
          status: AuthSessionStatus.EXPIRED,
          revokedAt: new Date(),
          revokedReason: 'REFRESH_TOKEN_EXPIRED',
        },
      });

      await this.recordThrottleFailure({
        action: AuthRateLimitAction.REFRESH,
        identifier: throttleIdentifier,
      });

      await this.recordAudit('auth.refresh_failed', existingSession.userId, {
        reason: 'REFRESH_TOKEN_EXPIRED',
        sessionId: existingSession.id,
      });

      throw new UnauthorizedException('Refresh token has expired.');
    }

    if (existingSession.user.status !== UserStatus.ACTIVE) {
      await this.recordThrottleFailure({
        action: AuthRateLimitAction.REFRESH,
        identifier: throttleIdentifier,
      });

      await this.recordAudit('auth.refresh_failed', existingSession.userId, {
        reason: 'ACCOUNT_NOT_ACTIVE',
        status: existingSession.user.status,
        sessionId: existingSession.id,
      });

      throw new ForbiddenException('This account is not active.');
    }

    const nextRefreshToken = this.tokenService.generateRefreshToken();
    const nextRefreshTokenHash =
      this.tokenService.hashRefreshToken(nextRefreshToken);
    const refreshTokenExpiresAt = this.tokenService.getRefreshTokenExpiresAt();

    const [, newSession, updatedUser] = await this.prisma.$transaction([
      this.prisma.authSession.update({
        where: {
          id: existingSession.id,
        },
        data: {
          status: AuthSessionStatus.REVOKED,
          revokedAt: new Date(),
          revokedReason: 'REFRESH_TOKEN_ROTATED',
          lastUsedAt: new Date(),
        },
      }),
      this.prisma.authSession.create({
        data: {
          userId: existingSession.userId,
          authAccountId: existingSession.authAccountId,
          refreshTokenHash: nextRefreshTokenHash,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          expiresAt: refreshTokenExpiresAt,
          lastUsedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: {
          id: existingSession.userId,
        },
        data: {
          lastLoginAt: new Date(),
        },
      }),
    ]);

    await this.recordAudit('auth.refresh', updatedUser.id, {
      previousSessionId: existingSession.id,
      newSessionId: newSession.id,
    });

    await this.recordThrottleSuccess({
      action: AuthRateLimitAction.REFRESH,
      identifier: throttleIdentifier,
    });

    return this.buildAuthResponse({
      user: updatedUser,
      authSession: newSession,
      refreshToken: nextRefreshToken,
      refreshTokenExpiresAt,
    });
  }

  async logout(user: RequestUser, dto: LogoutDto) {
    const now = new Date();

    if (dto.allSessions) {
      await this.prisma.authSession.updateMany({
        where: {
          userId: user.id,
          status: AuthSessionStatus.ACTIVE,
        },
        data: {
          status: AuthSessionStatus.REVOKED,
          revokedAt: now,
          revokedReason: 'USER_LOGOUT_ALL_SESSIONS',
        },
      });

      await this.recordAudit('auth.logout_all_sessions', user.id, null);

      return {
        status: 'ok',
        revokedScope: 'all_sessions',
      };
    }

    await this.prisma.authSession.updateMany({
      where: {
        id: user.authSessionId,
        userId: user.id,
        status: AuthSessionStatus.ACTIVE,
      },
      data: {
        status: AuthSessionStatus.REVOKED,
        revokedAt: now,
        revokedReason: 'USER_LOGOUT',
      },
    });

    await this.recordAudit('auth.logout', user.id, {
      authSessionId: user.authSessionId,
    });

    return {
      status: 'ok',
      revokedScope: 'current_session',
    };
  }

    async changePassword(user: RequestUser, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('New password confirmation does not match.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password.',
      );
    }

    const freshUser = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!freshUser) {
      throw new UnauthorizedException('Authenticated user was not found.');
    }

    if (freshUser.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active.');
    }

    if (!freshUser.passwordHash) {
      throw new BadRequestException(
        'This account does not currently have a local password.',
      );
    }

    const currentPasswordIsValid =
      await this.passwordService.verifyPassword(
        dto.currentPassword,
        freshUser.passwordHash,
      );

    if (!currentPasswordIsValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const nextPasswordHash = await this.passwordService.hashPassword(
      dto.newPassword,
    );

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordHash: nextPasswordHash,
        },
      }),
      this.prisma.authSession.updateMany({
        where: {
          userId: user.id,
          status: AuthSessionStatus.ACTIVE,
          id: {
            not: user.authSessionId,
          },
        },
        data: {
          status: AuthSessionStatus.REVOKED,
          revokedAt: now,
          revokedReason: 'PASSWORD_CHANGED',
        },
      }),
    ]);

    await this.recordAudit('auth.password_changed', user.id, {
      revokedOtherSessions: true,
    });

    return {
      status: 'ok',
      message: 'Password changed successfully.',
    };
  }

  async me(user: RequestUser) {
    const freshUser = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!freshUser) {
      throw new UnauthorizedException('Authenticated user was not found.');
    }

    if (freshUser.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active.');
    }

return {
  user: await this.toSafeUser(freshUser),
};
  }

  private async createAuthenticatedSession(input: {
    user: User;
    authAccountId: string | null;
    metadata: RequestMetadata;
  }): Promise<AuthResponse> {
    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.tokenService.getRefreshTokenExpiresAt();

    const authSession = await this.prisma.authSession.create({
      data: {
        userId: input.user.id,
        authAccountId: input.authAccountId,
        refreshTokenHash,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        expiresAt: refreshTokenExpiresAt,
        lastUsedAt: new Date(),
      },
    });

    return this.buildAuthResponse({
      user: input.user,
      authSession,
      refreshToken,
      refreshTokenExpiresAt,
    });
  }

  private async buildAuthResponse(input: {
    user: User;
    authSession: AuthSession;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
  }): Promise<AuthResponse> {
    const accessToken = await this.tokenService.signAccessToken({
      user: input.user,
      authSessionId: input.authSession.id,
    });

    return {
  user: await this.toSafeUser(input.user),
  accessToken,
  refreshToken: input.refreshToken,
  accessTokenExpiresAt: this.tokenService.getAccessTokenExpiresAt(),
  refreshTokenExpiresAt: input.refreshTokenExpiresAt,
};
  }

private async toSafeUser(user: User): Promise<SafeUser> {
  const organisation = user.organisationId
    ? await this.prisma.organisation.findUnique({
        where: {
          id: user.organisationId,
        },
        select: {
          id: true,
          name: true,
        },
      })
    : null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    organisationId: user.organisationId,
    organisationName: organisation?.name ?? null,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

  private normaliseEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private buildThrottleIdentifier(input: {
    action: string;
    metadata: RequestMetadata;
    email?: string;
    tokenHash?: string;
  }) {
    return [
      input.action,
      input.metadata.ipAddress ?? 'unknown-ip',
      input.email ?? input.tokenHash ?? 'unknown-subject',
    ].join(':');
  }

  private async recordThrottleSuccess(input: {
    action: AuthRateLimitAction;
    identifier: string;
  }) {
    await this.authThrottleService.record({
      action: input.action,
      identifier: input.identifier,
      success: true,
    });
  }

  private async recordThrottleFailure(input: {
    action: AuthRateLimitAction;
    identifier: string;
  }) {
    await this.authThrottleService.record({
      action: input.action,
      identifier: input.identifier,
      success: false,
    });
  }

  private async recordAudit(
    action: string,
    userId: string | null,
    metadata: unknown,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        userId,
        entityType: 'AUTH',
        entityId: userId,
        metadata:
          metadata === undefined || metadata === null
            ? undefined
            : this.toJsonValue(metadata),
      },
    });
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
