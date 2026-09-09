import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ReviewAssignedSectionItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  activate?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
