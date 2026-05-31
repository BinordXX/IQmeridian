import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from './audit.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('audit-logs')
@UseGuards(DevAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Get()
  listAuditLogs(
    @Req() req: { user: RequestUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditService.list({
      user: req.user,
      page,
      limit,
      action,
      entityType,
      entityId,
      userId,
    });
  }
}