import { PsychometricScoreBand } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateCandidateResultThresholdsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(PsychometricScoreBand)
  minimumOverallBand?: PsychometricScoreBand | null;

  @IsOptional()
  @IsEnum(PsychometricScoreBand)
  minimumAbstractReasoningBand?: PsychometricScoreBand | null;

  @IsOptional()
  @IsEnum(PsychometricScoreBand)
  minimumNumericalReasoningBand?: PsychometricScoreBand | null;

  @IsOptional()
  @IsBoolean()
  hideUnscoredFromFilteredView?: boolean;

  @IsOptional()
  @IsBoolean()
  requireNoHighSeverityValidityFlags?: boolean;
}
