import { IsNotEmpty, IsString } from 'class-validator';

export class SessionIdParamDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}