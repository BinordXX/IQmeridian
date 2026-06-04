import { IsNotEmpty, IsString } from 'class-validator';

export class AttachEmployerAdminDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
