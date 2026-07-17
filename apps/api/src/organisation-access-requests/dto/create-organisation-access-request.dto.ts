import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOrganisationAccessRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  organisationName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  contactName!: string;

  @IsEmail()
  @MaxLength(180)
  contactEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  contactPhone?: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  intendedUse!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  expectedVolume?: string;
}
