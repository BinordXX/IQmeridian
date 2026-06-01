import { IsEnum } from 'class-validator';
import { FormItemMappingStatus } from '@prisma/client';

export class UpdateFormItemMappingStatusDto {
  @IsEnum(FormItemMappingStatus)
  status!: FormItemMappingStatus;
}
