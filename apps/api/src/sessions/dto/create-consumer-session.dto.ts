import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConsumerSessionDto {
  @IsString()
  @IsNotEmpty()
  assessmentFormId!: string;
}