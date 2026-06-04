import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
