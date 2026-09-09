import { AssessmentDomain, AssessmentSectionType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAssessmentSectionDto {
  @IsEnum(AssessmentSectionType)
  type!: AssessmentSectionType;

  @IsEnum(AssessmentDomain)
  domain!: AssessmentDomain;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsInt()
  @Min(30)
  @Max(7200)
  timeLimitSec!: number;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetBankItemCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryItemCount?: number;

  @IsOptional()
  @IsObject()
  difficultyMix?: Record<string, unknown>;
}
