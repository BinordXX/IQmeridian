import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  organisationId!: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  assessmentFormId?: string;
}