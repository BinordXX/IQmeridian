import { IsString } from 'class-validator';

export class InvitationTokenParamDto {
  @IsString()
  token!: string;
}

export class InvitationIdParamDto {
  @IsString()
  id!: string;
}