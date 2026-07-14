import { IsString } from 'class-validator';

export class ParticipantIdParamDto {
  @IsString()
  id!: string;
}
