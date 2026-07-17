import { ContactMessageEnquiryType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  organisation?: string;

  @IsEnum(ContactMessageEnquiryType)
  enquiryType!: ContactMessageEnquiryType;

  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  message!: string;
}
