import { IsString } from 'class-validator';

export class OrganisationIdParamDto {
  @IsString()
  id!: string;
}
