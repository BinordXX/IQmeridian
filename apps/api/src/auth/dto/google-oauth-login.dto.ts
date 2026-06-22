import { IsString, MinLength } from 'class-validator';

export class GoogleOAuthLoginDto {
  @IsString()
  @MinLength(20)
  idToken!: string;
}
