import { IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptPlatformAdminInvitationDto {
  @IsString()
  @MinLength(12)
  @MaxLength(160)
  password!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(160)
  confirmPassword!: string;
}
