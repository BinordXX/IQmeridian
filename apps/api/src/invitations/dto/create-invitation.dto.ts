import { IsEmail, IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateInvitationDto {
  @IsString()
  campaignId!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  candidateUserId?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
