import { IsNotEmpty, IsString } from 'class-validator';

export class ItemIdParamDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}