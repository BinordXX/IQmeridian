import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    const users = {
      'Bearer dev-token': {
        id: 'dev-admin-1',
        email: 'admin@iqmeridian.local',
        role: 'PLATFORM_ADMIN',
        organisationId: 'dev-org-1',
      },
      'Bearer employer-token': {
        id: 'dev-employer-1',
        email: 'employer@iqmeridian.local',
        role: 'EMPLOYER_ADMIN',
        organisationId: 'dev-org-1',
      },
      'Bearer candidate-token': {
        id: 'dev-candidate-1',
        email: 'candidate@iqmeridian.local',
        role: 'CANDIDATE',
        organisationId: null,
      },
      'Bearer consumer-token': {
        id: 'dev-consumer-1',
        email: 'consumer@iqmeridian.local',
        role: 'CONSUMER',
        organisationId: null,
      },
    };

    const user = users[authHeader as keyof typeof users];

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    request.user = user;
    return true;
  }
}
