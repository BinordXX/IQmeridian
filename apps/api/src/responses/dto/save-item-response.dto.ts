import { IsDefined } from 'class-validator';

export class SaveItemResponseDto {
  @IsDefined()
  answer!: unknown;
}
