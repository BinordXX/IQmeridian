import { OrganisationAccessRequestStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewOrganisationAccessRequestDto {
  @IsIn([
    OrganisationAccessRequestStatus.APPROVED,
    OrganisationAccessRequestStatus.DECLINED,
  ])
  status!: OrganisationAccessRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;
}
