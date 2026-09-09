import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdatePublicProfileDto {
  @IsOptional()
  @IsBoolean()
  publicProfileEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  displayName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Profile slug may contain lowercase letters, numbers, and hyphens only.',
  })
  profileSlug?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(90)
  headline?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  quote?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(
    /^(https?:\/\/.+|\/uploads\/leaderboard-profiles\/[a-zA-Z0-9._-]+)$/,
    {
      message:
        'Avatar must be an uploaded profile image or a valid http(s) URL.',
    },
  )
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(500)
  websiteUrl?: string | null;
}
