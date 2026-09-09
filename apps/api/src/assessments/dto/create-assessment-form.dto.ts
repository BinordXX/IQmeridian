import { Type } from 'class-transformer';
import {
  AssessmentDomain,
  AssessmentFormStatus,
  AssessmentSectionType,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateAssessmentFormSectionDto {
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

export class CreateAssessmentFormDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  versionLabel?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(AssessmentFormStatus)
  formStatus?: AssessmentFormStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetBankItemCount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  deliveryItemCount?: number;

  @IsOptional()
  @IsBoolean()
  randomizeItems?: boolean;

  @IsOptional()
  @IsBoolean()
  randomizeOptions?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssessmentFormSectionDto)
  sections?: CreateAssessmentFormSectionDto[];
}
