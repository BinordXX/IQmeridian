import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewAssignedSectionItemDto } from './dto/review-assigned-section-item.dto';
import { CreateAssignedSectionItemDto } from './dto/create-assigned-section-item.dto';
import { UpdateAssignedSectionItemDto } from './dto/update-assigned-section-item.dto';
import { UpdateAssessmentFormPublicationDto } from './dto/update-assessment-form-publication.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  AssessmentFormIdParamDto,
  AssessmentFormRouteParamDto,
  FormItemMappingIdParamDto,
} from './dto/assessment-route-params.dto';
import { AttachItemToFormDto } from './dto/attach-item-to-form.dto';
import { CreateAssessmentFormDto } from './dto/create-assessment-form.dto';
import { CreateAssessmentSectionDto } from './dto/create-assessment-section.dto';
import { ListActiveFormsQueryDto } from './dto/list-active-forms-query.dto';
import { SetFormActiveDto } from './dto/set-form-active.dto';
import { UpdateFormItemMappingStatusDto } from './dto/update-form-item-mapping-status.dto';
import { AssessmentsService } from './assessments.service';
import { AssignResearcherToSectionDto } from './dto/assign-researcher-to-section.dto';
import { UpdateFormSectionAssignmentStatusDto } from './dto/update-form-section-assignment-status.dto';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('assessments/forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Patch(':id/publication')
  updateFormPublicationStatus(
    @Param() params: AssessmentFormIdParamDto,
    @Body() body: UpdateAssessmentFormPublicationDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.updateFormPublicationStatus(
      params.id,
      body.formStatus,
      req.user.id,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Get('items/review-queue')
  listAssignedSectionItemsForReview() {
    return this.assessmentsService.listAssignedSectionItemsForReview();
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Post('items/:itemId/review/start')
  startAssignedSectionItemReview(
    @Param('itemId') itemId: string,
    @Body() body: ReviewAssignedSectionItemDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.startAssignedSectionItemReview(
      itemId,
      body,
      req.user.id,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Post('items/:itemId/review/request-changes')
  requestAssignedSectionItemChanges(
    @Param('itemId') itemId: string,
    @Body() body: ReviewAssignedSectionItemDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.requestAssignedSectionItemChanges(
      itemId,
      body,
      req.user.id,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Post('items/:itemId/review/reject')
  rejectAssignedSectionItem(
    @Param('itemId') itemId: string,
    @Body() body: ReviewAssignedSectionItemDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.rejectAssignedSectionItem(
      itemId,
      body,
      req.user.id,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Post('items/:itemId/review/approve')
  approveAssignedSectionItem(
    @Param('itemId') itemId: string,
    @Body() body: ReviewAssignedSectionItemDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.approveAssignedSectionItem(
      itemId,
      body,
      req.user.id,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Post()
  createForm(
    @Body() body: CreateAssessmentFormDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.createForm(body, req.user.id);
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'RESEARCHER', 'EMPLOYER_ADMIN')
  @Get('active')
  findActiveForms(@Query() query: ListActiveFormsQueryDto) {
    return this.assessmentsService.findActiveForms(query);
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Get()
  listAssessmentForms(@Query('status') status?: string) {
    return this.assessmentsService.listAssessmentForms(status);
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'RESEARCHER')
  @Get('section-assignments/mine')
  listMySectionAssignments(@Req() req: { user: RequestUser }) {
    return this.assessmentsService.listMyResearcherAssignments(req.user.id);
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'RESEARCHER')
  @Get('section-assignments/:assignmentId/items')
  listItemsForSectionAssignment(
    @Param('assignmentId') assignmentId: string,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.listItemsForSectionAssignment(
      assignmentId,
      req.user,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'RESEARCHER')
  @Post('section-assignments/:assignmentId/items')
  createItemForSectionAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() body: CreateAssignedSectionItemDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.createItemForSectionAssignment(
      assignmentId,
      body,
      req.user,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'RESEARCHER')
  @Patch('section-assignments/:assignmentId/items/:itemId')
  updateItemForSectionAssignment(
    @Param('assignmentId') assignmentId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateAssignedSectionItemDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.updateItemForSectionAssignment(
      {
        assignmentId,
        itemId,
        updates: body,
      },
      req.user,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'RESEARCHER')
  @Post('section-assignments/:assignmentId/items/:itemId/submit')
  submitItemForReviewFromSectionAssignment(
    @Param('assignmentId') assignmentId: string,
    @Param('itemId') itemId: string,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.submitItemForReviewFromSectionAssignment(
      {
        assignmentId,
        itemId,
      },
      req.user,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'RESEARCHER', 'EMPLOYER_ADMIN')
  @Get(':id')
  findFormById(@Param() params: AssessmentFormIdParamDto) {
    return this.assessmentsService.findFormById(params.id);
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Patch(':id/active')
  setFormActive(
    @Param() params: AssessmentFormIdParamDto,
    @Body() body: SetFormActiveDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.setFormActive(
      params.id,
      body.isActive,
      req.user.id,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Post(':id/versions')
  createNextVersion(
    @Param() params: AssessmentFormIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.createNextVersion(params.id, req.user.id);
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Post(':formId/sections')
  createSection(
    @Param() params: AssessmentFormRouteParamDto,
    @Body() body: CreateAssessmentSectionDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.createSection(
      params.formId,
      body,
      req.user.id,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'RESEARCHER', 'EMPLOYER_ADMIN')
  @Get(':formId/sections')
  listSectionsForForm(@Param() params: AssessmentFormRouteParamDto) {
    return this.assessmentsService.listSectionsForForm(params.formId);
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Post(':formId/sections/:sectionId/researcher-assignments')
  assignResearcherToSection(
    @Param('formId') formId: string,
    @Param('sectionId') sectionId: string,
    @Body() body: AssignResearcherToSectionDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.assignResearcherToSection(
      {
        formId,
        sectionId,
        ...body,
      },
      req.user.id,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'RESEARCHER')
  @Get(':formId/sections/:sectionId/researcher-assignments')
  listResearcherAssignmentsForSection(
    @Param('formId') formId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.assessmentsService.listResearcherAssignmentsForSection({
      formId,
      sectionId,
    });
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Patch('section-assignments/:assignmentId/status')
  updateResearcherAssignmentStatus(
    @Param('assignmentId') assignmentId: string,
    @Body() body: UpdateFormSectionAssignmentStatusDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.updateResearcherAssignmentStatus(
      assignmentId,
      body.status,
      req.user.id,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Post(':formId/items')
  attachItemToForm(
    @Param() params: AssessmentFormRouteParamDto,
    @Body() body: AttachItemToFormDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.attachItemToForm(
      {
        formId: params.formId,
        ...body,
      },
      req.user.id,
    );
  }

  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @Patch('form-items/:mappingId/status')
  updateFormItemMappingStatus(
    @Param() params: FormItemMappingIdParamDto,
    @Body() body: UpdateFormItemMappingStatusDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.updateFormItemMappingStatus(
      params.mappingId,
      body.status,
      req.user.id,
    );
  }
}
