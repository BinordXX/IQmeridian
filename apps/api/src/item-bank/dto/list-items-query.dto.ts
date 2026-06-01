import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AssessmentDomain, ItemStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListItemsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AssessmentDomain)
  domain?: AssessmentDomain;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsString()
  formId?: string;
}
