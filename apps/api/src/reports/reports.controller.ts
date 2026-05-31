import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ReportVisibility } from '@prisma/client';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  ReportIdParamDto,
  ReportSessionParamDto,
  ReportSessionVisibilityParamDto,
} from './dto/report-route-params.dto';
import { ReportsService } from './reports.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('reports')
@UseGuards(DevAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @Post('sessions/:sessionId/candidate')
  generateCandidateReport(
    @Param() params: ReportSessionParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.reportsService.generateReport({
      sessionId: params.sessionId,
      visibility: ReportVisibility.CANDIDATE,
      user: req.user,
    });
  }

  @Roles('EMPLOYER_ADMIN', 'PLATFORM_ADMIN')
  @Post('sessions/:sessionId/employer')
  generateEmployerReport(
    @Param() params: ReportSessionParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.reportsService.generateReport({
      sessionId: params.sessionId,
      visibility: ReportVisibility.EMPLOYER,
      user: req.user,
    });
  }

  @Roles(
    'CANDIDATE',
    'CONSUMER',
    'EMPLOYER_ADMIN',
    'PLATFORM_ADMIN',
    'RESEARCHER',
  )
  @Get(':id')
  getReport(
    @Param() params: ReportIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.reportsService.getReportById(params.id, req.user);
  }

  @Roles(
    'CANDIDATE',
    'CONSUMER',
    'EMPLOYER_ADMIN',
    'PLATFORM_ADMIN',
    'RESEARCHER',
  )
  @Get('sessions/:sessionId/:visibility')
  getReportBySessionAndVisibility(
    @Param() params: ReportSessionVisibilityParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.reportsService.getReportBySessionAndVisibility(
      params.sessionId,
      params.visibility,
      req.user,
    );
  }
}