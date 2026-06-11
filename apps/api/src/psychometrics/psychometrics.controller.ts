import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';

import { PsychometricsService } from './psychometrics.service';
import { InternalPsychometricsRole } from './psychometrics.types';

function getInternalRole(
  roleHeader?: string,
): InternalPsychometricsRole | null {
  if (roleHeader === 'PLATFORM_ADMIN' || roleHeader === 'RESEARCHER') {
    return roleHeader;
  }

  return null;
}

function assertInternalPsychometricsAccess({
  roleHeader,
  allowedRoles,
}: {
  roleHeader?: string;
  allowedRoles: InternalPsychometricsRole[];
}) {
  const role = getInternalRole(roleHeader);

  if (!role) {
    throw new UnauthorizedException(
      'This psychometrics endpoint requires an authorised internal role.',
    );
  }

  if (!allowedRoles.includes(role)) {
    throw new ForbiddenException(
      'This internal role cannot access this psychometrics endpoint.',
    );
  }
}

@Controller('internal/psychometrics')
export class PsychometricsController {
  constructor(private readonly psychometricsService: PsychometricsService) {}

  @Get('health')
  getHealth(@Headers('x-internal-role') roleHeader?: string) {
    assertInternalPsychometricsAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.psychometricsService.getHealth();
  }

  @Get('version')
  getVersion(@Headers('x-internal-role') roleHeader?: string) {
    assertInternalPsychometricsAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.psychometricsService.getVersion();
  }

  @Get('capabilities')
  getCapabilities(@Headers('x-internal-role') roleHeader?: string) {
    assertInternalPsychometricsAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.psychometricsService.getCapabilities();
  }
}
