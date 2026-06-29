import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAccountNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  assessmentReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  productUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  researchGovernanceUpdates?: boolean;
}
