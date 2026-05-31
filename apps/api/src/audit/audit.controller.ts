import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from './audit.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

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
    @Query() query: ListAuditLogsQueryDto,
  ) {
    return this.auditService.list({
      user: req.user,
      ...query,
    });
  }
}