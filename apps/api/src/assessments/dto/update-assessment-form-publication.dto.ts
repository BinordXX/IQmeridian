import { AssessmentFormStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateAssessmentFormPublicationDto {
  @IsEnum(AssessmentFormStatus)
  formStatus!: AssessmentFormStatus;
}
