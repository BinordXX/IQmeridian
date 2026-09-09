import { FormSectionAssignmentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateFormSectionAssignmentStatusDto {
  @IsEnum(FormSectionAssignmentStatus)
  status!: FormSectionAssignmentStatus;
}
