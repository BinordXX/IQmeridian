import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { InternalToolingService } from './internal-tooling.service';

@Controller('internal')
export class InternalToolingController {
  constructor(
    private readonly internalToolingService: InternalToolingService,
  ) {}

  @Get('sessions')
  getSessionReviewRecords() {
    return this.internalToolingService.getSessionReviewRecords();
  }

  @Get('sessions/suspicious')
  getSuspiciousSessionRecords() {
    return this.internalToolingService.getSuspiciousSessionRecords();
  }

  @Get('sessions/:sessionId')
  getSessionById(@Param('sessionId') sessionId: string) {
    const session = this.internalToolingService.getSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Internal session record was not found.');
    }

    return session;
  }

  @Get('exports')
  getAnalyticsExportDefinitions() {
    return this.internalToolingService.getAnalyticsExportDefinitions();
  }
}
