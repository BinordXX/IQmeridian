import { IsISO8601 } from 'class-validator';

export class ExtendInvitationDto {
  @IsISO8601()
  expiresAt!: string;
}
