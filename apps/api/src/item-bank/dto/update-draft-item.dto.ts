import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import {
  AssessmentDomain,
  ItemIntendedDifficulty,
  ItemReviewStatus,
  PsychometricItemStatus,
} from '@prisma/client';

export class UpdateDraftItemDto {
  @IsOptional()
  @IsString()
  prompt?: string;
  @IsOptional()
  @IsEnum(AssessmentDomain)
  domain?: AssessmentDomain;

  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @IsString()
  itemFamily?: string;

  @IsOptional()
  @IsString()
  stimulusType?: string;

  @IsOptional()
  @IsString()
  scoringRule?: string;

  @IsOptional()
  @IsEnum(ItemIntendedDifficulty)
  intendedDifficulty?: ItemIntendedDifficulty;

  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedResponseTimeSec?: number;

  @IsOptional()
  @IsString()
  cognitiveProcess?: string;

  @IsOptional()
  @IsString()
  itemRationale?: string;

  @IsOptional()
  distractorRationale?: unknown;

  @IsOptional()
  @IsEnum(ItemReviewStatus)
  reviewStatus?: ItemReviewStatus;

  @IsOptional()
  @IsEnum(PsychometricItemStatus)
  psychometricStatus?: PsychometricItemStatus;
  @IsOptional()
  @IsString()
  itemType?: string;

  @IsOptional()
  options?: unknown;

  @IsOptional()
  correctAnswer?: unknown;

  @IsOptional()
  @IsString()
  difficulty?: string;
}
