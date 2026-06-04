import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AttachItemToFormDto {
  @IsString()
  @IsNotEmpty()
  sectionId!: string;

  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderIndex!: number;
}
