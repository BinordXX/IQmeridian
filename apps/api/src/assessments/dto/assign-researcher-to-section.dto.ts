import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AssignResearcherToSectionDto {
  @IsString()
  researcherId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetItemCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
