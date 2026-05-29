import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AssessmentDomain, AssessmentSectionType } from '@prisma/client';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssessmentsService } from './assessments.service';

@Controller('assessments/forms')
@UseGuards(DevAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Post()
  createForm(
    @Body()
    body: {
      name: string;
      version?: number;
      isActive?: boolean;
      sections?: {
        type: AssessmentSectionType;
        domain: AssessmentDomain;
        title: string;
        timeLimitSec: number;
        orderIndex: number;
      }[];
    },
  ) {
    return this.assessmentsService.createForm(body);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER', 'EMPLOYER_ADMIN')
  @Get('active')
  findActiveForms() {
    return this.assessmentsService.findActiveForms();
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER', 'EMPLOYER_ADMIN')
  @Get(':id')
  findFormById(@Param('id') id: string) {
    return this.assessmentsService.findFormById(id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Patch(':id/active')
  setFormActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.assessmentsService.setFormActive(id, body.isActive);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Post(':id/versions')
  createNextVersion(@Param('id') id: string) {
    return this.assessmentsService.createNextVersion(id);
  }
  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
@Post(':formId/sections')
createSection(
  @Param('formId') formId: string,
  @Body()
  body: {
    type: AssessmentSectionType;
    domain: AssessmentDomain;
    title: string;
    timeLimitSec: number;
    orderIndex: number;
  },
) {
  return this.assessmentsService.createSection(formId, body);
}

@Roles('PLATFORM_ADMIN', 'RESEARCHER', 'EMPLOYER_ADMIN')
@Get(':formId/sections')
listSectionsForForm(@Param('formId') formId: string) {
  return this.assessmentsService.listSectionsForForm(formId);
}
@Roles('PLATFORM_ADMIN', 'RESEARCHER')
@Post(':formId/items')
attachItemToForm(
  @Param('formId') formId: string,
  @Body()
  body: {
    sectionId: string;
    itemId: string;
    orderIndex: number;
  },
) {
  return this.assessmentsService.attachItemToForm({
    formId,
    ...body,
  });
}

@Roles('PLATFORM_ADMIN', 'RESEARCHER')
@Patch('form-items/:mappingId/status')
updateFormItemMappingStatus(
  @Param('mappingId') mappingId: string,
  @Body() body: { status: 'ACTIVE' | 'INACTIVE' },
) {
  return this.assessmentsService.updateFormItemMappingStatus(
    mappingId,
    body.status,
  );
}
}