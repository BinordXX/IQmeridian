import { ContactMessageStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateContactMessageStatusDto {
  @IsEnum(ContactMessageStatus)
  status!: ContactMessageStatus;
}
