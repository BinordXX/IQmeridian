import { IsString } from 'class-validator';

export class SessionIdParamDto {
  @IsString()
  sessionId!: string;
}

export class SessionItemParamDto {
  @IsString()
  sessionId!: string;

  @IsString()
  itemId!: string;
}
