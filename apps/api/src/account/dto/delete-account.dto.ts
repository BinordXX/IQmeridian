import { IsIn, IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @MinLength(1)
  password!: string;

  @IsString()
  @IsIn(['DELETE MY ACCOUNT'])
  confirmation!: 'DELETE MY ACCOUNT';
}