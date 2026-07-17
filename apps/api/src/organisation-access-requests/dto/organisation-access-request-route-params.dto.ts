import { IsString } from 'class-validator';

export class OrganisationAccessRequestIdParamDto {
  @IsString()
  id!: string;
}
