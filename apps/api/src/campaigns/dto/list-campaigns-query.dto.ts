import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CampaignStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListCampaignsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsString()
  organisationId?: string;

  @IsOptional()
  @IsString()
  assessmentFormId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;
}