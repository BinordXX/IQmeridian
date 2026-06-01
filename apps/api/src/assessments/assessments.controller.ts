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
import { ListActiveFormsQueryDto } from './dto/list-active-forms-query.dto';
import { DevAuthGuard } from '../auth/dev-auth.guard';
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
import { SetFormActiveDto } from './dto/set-form-active.dto';
import { UpdateFormItemMappingStatusDto } from './dto/update-form-item-mapping-status.dto';
import { AssessmentsService } from './assessments.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('assessments/forms')
@UseGuards(DevAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Post()
  createForm(
    @Body() body: CreateAssessmentFormDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.createForm(body, req.user.id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER', 'EMPLOYER_ADMIN')
  @Get('active')
  findActiveForms(@Query() query: ListActiveFormsQueryDto) {
    return this.assessmentsService.findActiveForms(query);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER', 'EMPLOYER_ADMIN')
  @Get(':id')
  findFormById(@Param() params: AssessmentFormIdParamDto) {
    return this.assessmentsService.findFormById(params.id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
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

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Post(':id/versions')
  createNextVersion(
    @Param() params: AssessmentFormIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.assessmentsService.createNextVersion(params.id, req.user.id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
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

  @Roles('PLATFORM_ADMIN', 'RESEARCHER', 'EMPLOYER_ADMIN')
  @Get(':formId/sections')
  listSectionsForForm(@Param() params: AssessmentFormRouteParamDto) {
    return this.assessmentsService.listSectionsForForm(params.formId);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
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

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
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
