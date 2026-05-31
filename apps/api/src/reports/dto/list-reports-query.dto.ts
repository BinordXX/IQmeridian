import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportVisibility } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListReportsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ReportVisibility)
  visibility?: ReportVisibility;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  subjectUserId?: string;

  @IsOptional()
  @IsString()
  scoreId?: string;
}