import { OrganisationParticipantStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateParticipantStatusDto {
  @IsEnum(OrganisationParticipantStatus)
  status!: OrganisationParticipantStatus;
}
