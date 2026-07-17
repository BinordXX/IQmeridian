import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateSessionFromInvitationDto {
  @IsString()
  @IsNotEmpty()
  invitationToken!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  applicantName?: string;

  @IsOptional()
  @IsBoolean()
  consentAccepted?: boolean;
}
