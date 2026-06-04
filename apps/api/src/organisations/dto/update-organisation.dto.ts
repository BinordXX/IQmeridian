import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
