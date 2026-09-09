import { IsNotEmpty, IsString } from 'class-validator';

export class ExchangeResultAccessTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
