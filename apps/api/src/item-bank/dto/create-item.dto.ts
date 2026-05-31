import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AssessmentDomain } from '@prisma/client';

export class CreateItemDto {
  @IsEnum(AssessmentDomain)
  domain!: AssessmentDomain;

  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsString()
  @IsNotEmpty()
  itemType!: string;

  @IsOptional()
  options?: unknown;

  @IsOptional()
  correctAnswer?: unknown;

  @IsOptional()
  @IsString()
  difficulty?: string;
}