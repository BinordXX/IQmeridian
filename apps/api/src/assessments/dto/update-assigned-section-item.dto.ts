import { ItemIntendedDifficulty } from '@prisma/client';
import {
  Allow,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAssignedSectionItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  prompt?: string;

  @IsOptional()
  @Allow()
  stimulus?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  itemType?: string;

  @IsOptional()
  @Allow()
  options?: unknown;

  @IsOptional()
  @Allow()
  correctAnswer?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  scoringRule?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  difficulty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subdomain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  itemFamily?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  stimulusType?: string;

  @IsOptional()
  @IsEnum(ItemIntendedDifficulty)
  intendedDifficulty?: ItemIntendedDifficulty;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7200)
  estimatedResponseTimeSec?: number;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  cognitiveProcess?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  itemRationale?: string;

  @IsOptional()
  @Allow()
  distractorRationale?: unknown;
}
