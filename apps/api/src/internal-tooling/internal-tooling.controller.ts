import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/request-user.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InternalToolingService } from './internal-tooling.service';
import {
  ActivateInternalItemInput,
  CreateAnalyticsExportRequestInput,
  CreateInternalAssessmentFormInput,
  CreateInternalAuditEventInput,
  CreateInternalDraftItemInput,
  CreateInternalItemFormMappingInput,
  CreateInternalReviewStatusInput,
  DirectAnalyticsExportInput,
  GenerateAnalyticsExportRequestInput,
  ReviewAnalyticsExportRequestInput,
  UpdateAnalyticsExportGovernanceSettingInput,
  UpdateInternalDraftItemInput,
  UpdateInternalItemStatusInput,
  UpdatePilotFormStatusInput,
} from './internal-tooling.types';

type InternalApiRole = 'PLATFORM_ADMIN' | 'RESEARCHER';

@Controller('internal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'RESEARCHER')
export class InternalToolingController {
  constructor(
    private readonly internalToolingService: InternalToolingService,
  ) {}

  private getInternalActorRole(user: RequestUser): InternalApiRole {
    return user.role as InternalApiRole;
  }

  @Post('pilot-forms/general-cognitive-ability-v0-1')
  createFormalPilotForm() {
    return this.internalToolingService.createFormalPilotForm();
  }

  @Get('forms')
  getInternalAssessmentForms() {
    return this.internalToolingService.getInternalAssessmentForms();
  }

  @Post('forms')
  createInternalAssessmentForm(
    @Body() body: CreateInternalAssessmentFormInput,
  ) {
    return this.internalToolingService.createInternalAssessmentForm(body);
  }

  @Get('pilot-forms')
  getInternalPilotForms() {
    return this.internalToolingService.getInternalPilotForms();
  }

  @Get('pilot-forms/:formId')
  async getInternalPilotFormById(@Param('formId') formId: string) {
    const form =
      await this.internalToolingService.getInternalPilotFormById(formId);

    if (!form) {
      throw new NotFoundException('Pilot form was not found.');
    }

    return form;
  }

  @Get('pilot-forms/:formId/blueprint-validation')
  validatePilotFormBlueprint(@Param('formId') formId: string) {
    return this.internalToolingService.validatePilotFormBlueprint(formId);
  }

  @Patch('pilot-forms/:formId/status')
  updatePilotFormStatus(
    @Param('formId') formId: string,
    @Body() input: UpdatePilotFormStatusInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.internalToolingService.updatePilotFormStatus(
      formId,
      input,
      this.getInternalActorRole(user),
    );
  }

  @Post('items')
  createInternalDraftItem(@Body() input: CreateInternalDraftItemInput) {
    return this.internalToolingService.createInternalDraftItem(input);
  }

  @Post('items/:itemId/activate')
  activateInternalItem(
    @Param('itemId') itemId: string,
    @Body() input: ActivateInternalItemInput,
  ) {
    return this.internalToolingService.activateInternalItem(itemId, input);
  }

  @Patch('items/:itemId')
  updateInternalDraftItem(
    @Param('itemId') itemId: string,
    @Body() input: UpdateInternalDraftItemInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.internalToolingService.updateInternalDraftItem(
      itemId,
      input,
      this.getInternalActorRole(user),
    );
  }

  @Post('items/:itemId/status')
  updateInternalItemStatus(
    @Param('itemId') itemId: string,
    @Body() input: UpdateInternalItemStatusInput,
  ) {
    return this.internalToolingService.updateInternalItemStatus(itemId, input);
  }

  @Get('performance/sections')
  getSectionPerformanceSummaries() {
    return this.internalToolingService.getSectionPerformanceSummaries();
  }

  @Get('performance/forms')
  getFormPerformanceSummaries() {
    return this.internalToolingService.getFormPerformanceSummaries();
  }

  @Get('researcher/dashboard')
  getResearcherDashboardOverview() {
    return this.internalToolingService.getResearcherDashboardOverview();
  }

  @Get('admin/overview')
  @Roles('PLATFORM_ADMIN')
  getAdminOverview() {
    return this.internalToolingService.getAdminOverview();
  }

  @Post('items/:itemId/form-mappings')
  attachInternalItemToForm(
    @Param('itemId') itemId: string,
    @Body() input: CreateInternalItemFormMappingInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.internalToolingService.attachInternalItemToForm(
      itemId,
      input,
      this.getInternalActorRole(user),
    );
  }

  @Get('items/:itemId/traceability')
  async getInternalItemTraceability(@Param('itemId') itemId: string) {
    const traceability =
      await this.internalToolingService.getInternalItemTraceability(itemId);

    if (!traceability) {
      throw new NotFoundException('Internal item traceability was not found.');
    }

    return traceability;
  }

  @Get('reports/score-audit')
  getReportScoreAuditRecords() {
    return this.internalToolingService.getReportScoreAuditRecords();
  }

  @Get('items')
  getInternalItems() {
    return this.internalToolingService.getInternalItems();
  }

  @Get('items/:itemId/performance')
  async getInternalItemPerformance(@Param('itemId') itemId: string) {
    const performance =
      await this.internalToolingService.getInternalItemPerformance(itemId);

    if (!performance) {
      throw new NotFoundException('Internal item performance was not found.');
    }

    return performance;
  }

  @Get('items/:itemId')
  async getInternalItemById(@Param('itemId') itemId: string) {
    const item = await this.internalToolingService.getInternalItemById(itemId);

    if (!item) {
      throw new NotFoundException('Internal item record was not found.');
    }

    return item;
  }

  @Get('sessions')
  @Roles('PLATFORM_ADMIN')
  getSessionReviewRecords() {
    return this.internalToolingService.getSessionReviewRecords();
  }

  @Get('sessions/suspicious')
  @Roles('PLATFORM_ADMIN')
  getSuspiciousSessionRecords() {
    return this.internalToolingService.getSuspiciousSessionRecords();
  }

  @Get('sessions/:sessionId')
  @Roles('PLATFORM_ADMIN')
  async getSessionById(@Param('sessionId') sessionId: string) {
    const session = await this.internalToolingService.getSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Internal session record was not found.');
    }

    return session;
  }

  @Get('exports')
  getAnalyticsExportDefinitions() {
    return this.internalToolingService.getAnalyticsExportDefinitions();
  }

  @Get('exports/governance')
  getAnalyticsExportGovernanceSetting() {
    return this.internalToolingService.getAnalyticsExportGovernanceSetting();
  }

  @Patch('exports/governance')
  @Roles('PLATFORM_ADMIN')
  updateAnalyticsExportGovernanceSetting(
    @Body() input: UpdateAnalyticsExportGovernanceSettingInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.internalToolingService.updateAnalyticsExportGovernanceSetting(
      input,
      this.getInternalActorRole(user),
    );
  }

  @Post('exports/direct')
  @Roles('PLATFORM_ADMIN')
  createDirectAnalyticsExport(
    @Body() input: DirectAnalyticsExportInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.internalToolingService.createDirectAnalyticsExport(
      input,
      this.getInternalActorRole(user),
    );
  }

  @Get('exports/requests')
  getAnalyticsExportRequests(@CurrentUser() user: RequestUser) {
    return this.internalToolingService.getAnalyticsExportRequests(
      this.getInternalActorRole(user),
    );
  }

  @Post('exports/requests')
  recordAnalyticsExportRequest(
    @Body() input: CreateAnalyticsExportRequestInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.internalToolingService.recordAnalyticsExportRequest(
      input,
      this.getInternalActorRole(user),
    );
  }

  @Patch('exports/requests/:requestId/review')
  @Roles('PLATFORM_ADMIN')
  reviewAnalyticsExportRequest(
    @Param('requestId') requestId: string,
    @Body() input: ReviewAnalyticsExportRequestInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.internalToolingService.reviewAnalyticsExportRequest(
      requestId,
      input,
      this.getInternalActorRole(user),
    );
  }

  @Get('audit')
  @Roles('PLATFORM_ADMIN')
  getInternalAuditEvents() {
    return this.internalToolingService.getInternalAuditEvents();
  }

  @Post('audit')
  recordInternalAuditEvent(@Body() input: CreateInternalAuditEventInput) {
    return this.internalToolingService.recordInternalAuditEvent(input);
  }

  @Get('review-statuses')
  getInternalReviewStatusRecords() {
    return this.internalToolingService.getInternalReviewStatusRecords();
  }

  @Post('review-statuses')
  recordInternalReviewStatus(@Body() input: CreateInternalReviewStatusInput) {
    return this.internalToolingService.recordInternalReviewStatus(input);
  }

  @Post('exports/requests/:requestId/generate')
  @Roles('PLATFORM_ADMIN')
  generateAnalyticsExportRequest(
    @Param('requestId') requestId: string,
    @Body() input: GenerateAnalyticsExportRequestInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.internalToolingService.generateAnalyticsExportRequest(
      requestId,
      input,
      this.getInternalActorRole(user),
    );
  }

  @Get('exports/requests/:requestId/download')
  downloadGeneratedAnalyticsExportRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.internalToolingService.downloadGeneratedAnalyticsExportRequest(
      requestId,
      this.getInternalActorRole(user),
    );
  }
}
