import { IsString } from 'class-validator';

export class ScoreSessionParamDto {
  @IsString()
  sessionId!: string;
}