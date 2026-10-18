import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class InvitePlatformAdminDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;
}
