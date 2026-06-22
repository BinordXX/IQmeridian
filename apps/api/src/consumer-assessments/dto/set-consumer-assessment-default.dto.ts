import { IsString, MinLength } from 'class-validator';

export class SetConsumerAssessmentDefaultDto {
  @IsString()
  @MinLength(1)
  assessmentFormId!: string;
}
