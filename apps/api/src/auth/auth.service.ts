import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthProvider,
  AuthSession,
  AuthSessionStatus,
  Prisma,
  User,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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
  ) {}

  async register(
    dto: RegisterDto,
    metadata: RequestMetadata,
  ): Promise<AuthResponse> {
    const email = this.normaliseEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);
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

    return this.createAuthenticatedSession({
      user,
      authAccountId: user.authAccounts[0]?.id ?? null,
      metadata,
    });
  }

  async login(dto: LoginDto, metadata: RequestMetadata): Promise<AuthResponse> {
    const email = this.normaliseEmail(dto.email);
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
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active.');
    }

    const passwordIsValid = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
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

    const existingSession = await this.prisma.authSession.findUnique({
      where: {
        refreshTokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!existingSession) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (existingSession.status !== AuthSessionStatus.ACTIVE) {
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

      throw new UnauthorizedException('Refresh token has expired.');
    }

    if (existingSession.user.status !== UserStatus.ACTIVE) {
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
      user: this.toSafeUser(freshUser),
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
      user: this.toSafeUser(input.user),
      accessToken,
      refreshToken: input.refreshToken,
      accessTokenExpiresAt: this.tokenService.getAccessTokenExpiresAt(),
      refreshTokenExpiresAt: input.refreshTokenExpiresAt,
    };
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      organisationId: user.organisationId,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private normaliseEmail(email: string): string {
    return email.trim().toLowerCase();
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
