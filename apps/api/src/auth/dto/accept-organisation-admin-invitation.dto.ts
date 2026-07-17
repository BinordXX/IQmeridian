import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptOrganisationAdminInvitationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsString()
  @MinLength(12)
  @MaxLength(160)
  password!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(160)
  confirmPassword!: string;
}
