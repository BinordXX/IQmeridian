import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
} from '@nestjs/common';

import { InternalToolingService } from './internal-tooling.service';

type InternalApiRole = 'PLATFORM_ADMIN' | 'RESEARCHER';

function getInternalApiRole(roleHeader?: string): InternalApiRole | null {
  if (roleHeader === 'PLATFORM_ADMIN' || roleHeader === 'RESEARCHER') {
    return roleHeader;
  }

  return null;
}

function assertInternalAccess({
  roleHeader,
  allowedRoles,
}: {
  roleHeader?: string;
  allowedRoles: InternalApiRole[];
}) {
  const role = getInternalApiRole(roleHeader);

  if (!role || !allowedRoles.includes(role)) {
    throw new ForbiddenException(
      'This internal tooling endpoint requires an authorised internal role.',
    );
  }
}

@Controller('internal')
export class InternalToolingController {
  constructor(
    private readonly internalToolingService: InternalToolingService,
  ) {}

  @Get('sessions')
  getSessionReviewRecords(@Headers('x-internal-role') roleHeader?: string) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN'],
    });

    return this.internalToolingService.getSessionReviewRecords();
  }

  @Get('sessions/suspicious')
  getSuspiciousSessionRecords(@Headers('x-internal-role') roleHeader?: string) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN'],
    });

    return this.internalToolingService.getSuspiciousSessionRecords();
  }

  @Get('sessions/:sessionId')
  getSessionById(
    @Param('sessionId') sessionId: string,
    @Headers('x-internal-role') roleHeader?: string,
  ) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN'],
    });

    const session = this.internalToolingService.getSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Internal session record was not found.');
    }

    return session;
  }

  @Get('exports')
  getAnalyticsExportDefinitions(
    @Headers('x-internal-role') roleHeader?: string,
  ) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.internalToolingService.getAnalyticsExportDefinitions();
  }
}
