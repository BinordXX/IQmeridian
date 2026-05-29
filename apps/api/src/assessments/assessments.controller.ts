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
}