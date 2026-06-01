import { IsOptional, IsString } from 'class-validator';

export class UpdateDraftItemDto {
  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  itemType?: string;

  @IsOptional()
  options?: unknown;

  @IsOptional()
  correctAnswer?: unknown;

  @IsOptional()
  @IsString()
  difficulty?: string;
}
