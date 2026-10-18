import { IsEmail, MaxLength } from 'class-validator';

export class PermanentlyDeleteUserDto {
  @IsEmail()
  @MaxLength(320)
  confirmationEmail!: string;
}
