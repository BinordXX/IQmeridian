import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConsumerSessionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  assessmentFormId?: string;
}
