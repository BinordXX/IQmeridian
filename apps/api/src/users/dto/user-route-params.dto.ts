import { IsNotEmpty, IsString } from 'class-validator';

export class OrganisationIdParamDto {
  @IsString()
  @IsNotEmpty()
  organisationId!: string;
}