import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  token!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(160)
  password!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(160)
  confirmPassword!: string;
}
