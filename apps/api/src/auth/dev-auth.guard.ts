import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

type DevRole = 'PLATFORM_ADMIN' | 'EMPLOYER_ADMIN' | 'CANDIDATE' | 'CONSUMER';

type DevAuthUser = {
  id: string;
  email: string;
  role: DevRole;
  roles: DevRole[];
  organisationId: string | null;
};

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: {
        authorization?: string;
      };
      user?: DevAuthUser;
    }>();

    const authHeader = request.headers.authorization;

    const users: Record<string, DevAuthUser> = {
      'Bearer dev-token': {
        id: 'dev-platform-admin',
        email: 'platform.admin@iqmeridian.dev',
        role: 'PLATFORM_ADMIN',
        roles: ['PLATFORM_ADMIN'],
        organisationId: null,
      },
      'Bearer employer-token': {
        id: 'dev-employer-admin',
        email: 'employer.admin@iqmeridian.dev',
        role: 'EMPLOYER_ADMIN',
        roles: ['EMPLOYER_ADMIN'],
        organisationId: 'dev-employer-org',
      },
      'Bearer candidate-token': {
        id: 'dev-candidate-1',
        email: 'candidate.one@iqmeridian.dev',
        role: 'CANDIDATE',
        roles: ['CANDIDATE'],
        organisationId: null,
      },
      'Bearer consumer-token': {
        id: 'dev-consumer-1',
        email: 'consumer.one@iqmeridian.dev',
        role: 'CONSUMER',
        roles: ['CONSUMER'],
        organisationId: null,
      },
    };

    const user = authHeader ? users[authHeader] : undefined;

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    request.user = user;

    return true;
  }
}
