import { IsString } from 'class-validator';

export class CampaignIdParamDto {
  @IsString()
  id!: string;
}