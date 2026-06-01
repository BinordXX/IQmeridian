import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSessionFromInvitationDto {
  @IsString()
  @IsNotEmpty()
  invitationToken!: string;
}
