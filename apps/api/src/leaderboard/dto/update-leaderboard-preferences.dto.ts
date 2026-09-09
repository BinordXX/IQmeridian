import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeaderboardPreferencesDto {
  @IsOptional()
  @IsBoolean()
  optIn?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  displayName?: string | null;
}
