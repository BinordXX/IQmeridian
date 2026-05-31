import { IsEnum, IsString } from 'class-validator';
import { ReportVisibility } from '@prisma/client';

export class ReportIdParamDto {
  @IsString()
  id!: string;
}

export class ReportSessionParamDto {
  @IsString()
  sessionId!: string;
}

export class ReportSessionVisibilityParamDto {
  @IsString()
  sessionId!: string;

  @IsEnum(ReportVisibility)
  visibility!: ReportVisibility;
}