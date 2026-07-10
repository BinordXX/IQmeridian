import { IsEmail, MaxLength } from 'class-validator';

export class ResendEmailVerificationDto {
  @IsEmail()
  @MaxLength(180)
  email!: string;
}