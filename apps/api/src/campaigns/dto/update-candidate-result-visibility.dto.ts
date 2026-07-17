import { CandidateResultVisibility } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCandidateResultVisibilityDto {
  @IsEnum(CandidateResultVisibility)
  candidateResultVisibility!: CandidateResultVisibility;
}