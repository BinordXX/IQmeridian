import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SessionStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListSessionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  assessmentFormId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
