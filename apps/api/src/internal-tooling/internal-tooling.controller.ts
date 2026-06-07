import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';

import { InternalToolingService } from './internal-tooling.service';
import {
  CreateInternalAuditEventInput,
  CreateInternalReviewStatusInput,
} from './internal-tooling.types';

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

  @Get('performance/sections')
  getSectionPerformanceSummaries(
    @Headers('x-internal-role') roleHeader?: string,
  ) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.internalToolingService.getSectionPerformanceSummaries();
  }

  @Get('performance/forms')
  getFormPerformanceSummaries(@Headers('x-internal-role') roleHeader?: string) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.internalToolingService.getFormPerformanceSummaries();
  }

  @Get('researcher/dashboard')
  getResearcherDashboardOverview(
    @Headers('x-internal-role') roleHeader?: string,
  ) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.internalToolingService.getResearcherDashboardOverview();
  }

  @Get('admin/overview')
  getAdminOverview(@Headers('x-internal-role') roleHeader?: string) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN'],
    });

    return this.internalToolingService.getAdminOverview();
  }

  @Get('items')
  getInternalItems(@Headers('x-internal-role') roleHeader?: string) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.internalToolingService.getInternalItems();
  }

  @Get('items/:itemId/performance')
  async getInternalItemPerformance(
    @Param('itemId') itemId: string,
    @Headers('x-internal-role') roleHeader?: string,
  ) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    const performance =
      await this.internalToolingService.getInternalItemPerformance(itemId);

    if (!performance) {
      throw new NotFoundException('Internal item performance was not found.');
    }

    return performance;
  }

  @Get('items/:itemId')
  async getInternalItemById(
    @Param('itemId') itemId: string,
    @Headers('x-internal-role') roleHeader?: string,
  ) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    const item = await this.internalToolingService.getInternalItemById(itemId);

    if (!item) {
      throw new NotFoundException('Internal item record was not found.');
    }

    return item;
  }

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
  async getSessionById(
    @Param('sessionId') sessionId: string,
    @Headers('x-internal-role') roleHeader?: string,
  ) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN'],
    });

    const session = await this.internalToolingService.getSessionById(sessionId);

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

  @Get('audit')
  getInternalAuditEvents(@Headers('x-internal-role') roleHeader?: string) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN'],
    });

    return this.internalToolingService.getInternalAuditEvents();
  }

  @Post('audit')
  recordInternalAuditEvent(
    @Body() input: CreateInternalAuditEventInput,
    @Headers('x-internal-role') roleHeader?: string,
  ) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.internalToolingService.recordInternalAuditEvent(input);
  }

  @Get('review-statuses')
  getInternalReviewStatusRecords(
    @Headers('x-internal-role') roleHeader?: string,
  ) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.internalToolingService.getInternalReviewStatusRecords();
  }

  @Post('review-statuses')
  recordInternalReviewStatus(
    @Body() input: CreateInternalReviewStatusInput,
    @Headers('x-internal-role') roleHeader?: string,
  ) {
    assertInternalAccess({
      roleHeader,
      allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    });

    return this.internalToolingService.recordInternalReviewStatus(input);
  }
}
