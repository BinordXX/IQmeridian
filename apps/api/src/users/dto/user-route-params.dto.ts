import { IsNotEmpty, IsString } from 'class-validator';

export class OrganisationIdParamDto {
  @IsString()
  @IsNotEmpty()
  organisationId!: string;
}

export class UserIdParamDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
