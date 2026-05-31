import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { AssessmentDomain, AssessmentSectionType } from '@prisma/client';

export class CreateAssessmentSectionDto {
  @IsEnum(AssessmentSectionType)
  type!: AssessmentSectionType;

  @IsEnum(AssessmentDomain)
  domain!: AssessmentDomain;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeLimitSec!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderIndex!: number;
}