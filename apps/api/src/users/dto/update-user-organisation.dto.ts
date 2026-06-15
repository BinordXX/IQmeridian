import { IsOptional, IsString } from 'class-validator';

export class UpdateUserOrganisationDto {
  @IsOptional()
  @IsString()
  organisationId?: string | null;
}
