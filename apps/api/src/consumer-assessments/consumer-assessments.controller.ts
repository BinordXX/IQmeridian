import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ConsumerAssessmentsService } from './consumer-assessments.service';
import { SetConsumerAssessmentDefaultDto } from './dto/set-consumer-assessment-default.dto';

type RequestUser = {
  id: string;
  email: string;
  role: string;
};

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsumerAssessmentsController {
  constructor(
    private readonly consumerAssessmentsService: ConsumerAssessmentsService,
  ) {}

  @Roles('CONSUMER', 'PLATFORM_ADMIN')
  @Get('consumer/assessment/default')
  getConsumerDefaultAssessment() {
    return this.consumerAssessmentsService.getConsumerDefaultAssessment();
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Get('internal/consumer-assessment/default')
  getInternalDefaultAssessment() {
    return this.consumerAssessmentsService.getInternalDefaultAssessment();
  }

  @Roles('PLATFORM_ADMIN')
  @Patch('internal/consumer-assessment/default')
  setInternalDefaultAssessment(
    @Req() req: { user: RequestUser },
    @Body() body: SetConsumerAssessmentDefaultDto,
  ) {
    return this.consumerAssessmentsService.setDefaultAssessment(body, req.user);
  }
}
