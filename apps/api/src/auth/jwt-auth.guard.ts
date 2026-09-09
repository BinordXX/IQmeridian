import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthSessionStatus,
  OrganisationMembershipStatus,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser, RoleName } from './request-user.type';
import { TokenService } from './token.service';

type RequestWithAuth = {
  headers: Record<string, string | string[] | undefined>;
  user?: RequestUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Authentication is required.');
    }

    let payload;

    try {
      payload = await this.tokenService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const authSession = await this.prisma.authSession.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        status: AuthSessionStatus.ACTIVE,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            organisationMemberships: {
              where: {
                status: OrganisationMembershipStatus.ACTIVE,
              },
              include: {
                organisation: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!authSession) {
      throw new UnauthorizedException('Authentication session is not active.');
    }

    if (authSession.user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active.');
    }

    const organisationMemberships =
      authSession.user.organisationMemberships.map((membership) => ({
        id: membership.id,
        organisationId: membership.organisationId,
        organisationName: membership.organisation.name,
        role: membership.role,
        status: membership.status,
      }));

    const roles = Array.from(
      new Set<RoleName>([
        authSession.user.role,
        ...organisationMemberships.map((membership) => membership.role),
      ]),
    );

    request.user = {
      id: authSession.user.id,
      email: authSession.user.email,
      name: authSession.user.name,
      role: authSession.user.role,
      roles,
      status: authSession.user.status,
      organisationId: authSession.user.organisationId,
      organisationMemberships,
      authSessionId: authSession.id,
    };

    return true;
  }

  private extractBearerToken(
    authorization: string | string[] | undefined,
  ): string | null {
    const header = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (!header?.startsWith('Bearer ')) {
      return null;
    }

    const token = header.slice('Bearer '.length).trim();

    return token.length > 0 ? token : null;
  }
}
