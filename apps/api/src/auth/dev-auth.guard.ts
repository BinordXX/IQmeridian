import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (authHeader === 'Bearer dev-token') {
      request.user = {
        id: 'dev-admin-1',
        email: 'admin@iqmeridian.local',
        role: 'PLATFORM_ADMIN',
      };
      return true;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}