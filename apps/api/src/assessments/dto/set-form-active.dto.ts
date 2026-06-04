import { IsBoolean } from 'class-validator';

export class SetFormActiveDto {
  @IsBoolean()
  isActive!: boolean;
}
