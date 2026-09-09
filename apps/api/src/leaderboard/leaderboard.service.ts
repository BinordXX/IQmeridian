import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PsychometricScoreBand,
  PsychometricValiditySeverity,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateLeaderboardPreferencesDto } from './dto/update-leaderboard-preferences.dto';
import { UpdatePublicProfileDto } from './dto/update-public-profile.dto';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

type RankedLeaderboardRow = {
  rank: number;
  resultId: string;
  userId: string;
  displayName: string;
  profileSlug: string | null;
  avatarUrl: string | null;
  iqScore: number;
  percentile: number | null;
  scoreBand: PsychometricScoreBand;
  generatedAt: Date;
};

const DEFAULT_PUBLIC_LIMIT = 50;
const MAX_PUBLIC_LIMIT = 100;
const MAX_RANKING_POOL = 1000;

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicLeaderboard(limitInput?: string) {
    const limit = this.resolveLimit(limitInput);
    const rankedRows = await this.getRankedLeaderboardRows(MAX_RANKING_POOL);

    return {
      generatedAt: new Date().toISOString(),
      limit,
      count: Math.min(limit, rankedRows.length),
      totalRanked: rankedRows.length,
      entries: rankedRows.slice(0, limit).map((row) => this.toPublicEntry(row)),
    };
  }

  async getPublicProfile(slug: string) {
    const profileSlug = this.sanitizeProfileSlug(slug);

    if (!profileSlug) {
      throw new NotFoundException('Public profile not found');
    }

    const account = await this.prisma.user.findFirst({
      where: {
        role: UserRole.CONSUMER,
        leaderboardOptIn: true,
        publicProfileEnabled: true,
        publicProfileSlug: profileSlug,
      },
      select: {
        id: true,
        leaderboardDisplayName: true,
        publicProfileSlug: true,
        publicProfileHeadline: true,
        publicProfileBio: true,
        publicProfileQuote: true,
        publicProfileLocation: true,
        publicProfileAvatarUrl: true,
        publicProfileWebsiteUrl: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Public profile not found');
    }

    const rankedRows = await this.getRankedLeaderboardRows(MAX_RANKING_POOL);
    const rankedRow = rankedRows.find((row) => row.userId === account.id);

    if (!rankedRow) {
      throw new NotFoundException(
        'Public profile has no eligible leaderboard result',
      );
    }

    return {
      profile: {
        slug: account.publicProfileSlug,
        displayName: this.toPublicDisplayName(account.leaderboardDisplayName),
        headline: account.publicProfileHeadline,
        bio: account.publicProfileBio,
        quote: account.publicProfileQuote,
        location: account.publicProfileLocation,
        avatarUrl: account.publicProfileAvatarUrl,
        websiteUrl: account.publicProfileWebsiteUrl,
      },
      leaderboard: this.toPublicEntry(rankedRow),
    };
  }

  async getMyLeaderboardSummary(user: RequestUser) {
    this.assertConsumer(user);

    const account = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        role: true,
        leaderboardOptIn: true,
        leaderboardDisplayName: true,
        publicProfileEnabled: true,
        publicProfileSlug: true,
      },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    const bestEligibleResult = await this.getBestEligibleResultForUser(user.id);
    const rankedRows = await this.getRankedLeaderboardRows(MAX_RANKING_POOL);
    const rankedRow = rankedRows.find((row) => row.userId === user.id) ?? null;

    return {
      preferences: {
        optIn: account.leaderboardOptIn,
        displayName: account.leaderboardDisplayName,
        publicProfileEnabled: account.publicProfileEnabled,
        publicProfileSlug: account.publicProfileSlug,
      },
      eligibility: {
        eligible: Boolean(bestEligibleResult),
        publicListingActive: Boolean(account.leaderboardOptIn && rankedRow),
        reasons: this.getEligibilityReasons({
          optIn: account.leaderboardOptIn,
          hasEligibleResult: Boolean(bestEligibleResult),
        }),
      },
      rank: rankedRow?.rank ?? null,
      totalRanked: rankedRows.length,
      entry: rankedRow
        ? this.toPublicEntry(rankedRow)
        : bestEligibleResult
          ? this.toPrivateEligibleEntry(bestEligibleResult)
          : null,
    };
  }

  async updateMyLeaderboardPreferences(
    user: RequestUser,
    dto: UpdateLeaderboardPreferencesDto,
  ) {
    this.assertConsumer(user);

    const data: Prisma.UserUpdateInput = {};

    if (typeof dto.optIn === 'boolean') {
      data.leaderboardOptIn = dto.optIn;
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'displayName')) {
      data.leaderboardDisplayName = this.sanitizeDisplayName(dto.displayName);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'No leaderboard preference changes supplied',
      );
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data,
    });

    return this.getMyLeaderboardSummary(user);
  }

  async getMyPublicProfile(user: RequestUser) {
    this.assertConsumer(user);

    const account = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        leaderboardOptIn: true,
        leaderboardDisplayName: true,
        publicProfileEnabled: true,
        publicProfileSlug: true,
        publicProfileHeadline: true,
        publicProfileBio: true,
        publicProfileQuote: true,
        publicProfileLocation: true,
        publicProfileAvatarUrl: true,
        publicProfileWebsiteUrl: true,
      },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    const bestEligibleResult = await this.getBestEligibleResultForUser(user.id);
    const rankedRows = await this.getRankedLeaderboardRows(MAX_RANKING_POOL);
    const rankedRow = rankedRows.find((row) => row.userId === user.id) ?? null;

    return {
      profile: {
        publicProfileEnabled: account.publicProfileEnabled,
        profileSlug: account.publicProfileSlug,
        displayName: account.leaderboardDisplayName,
        headline: account.publicProfileHeadline,
        bio: account.publicProfileBio,
        quote: account.publicProfileQuote,
        location: account.publicProfileLocation,
        avatarUrl: account.publicProfileAvatarUrl,
        websiteUrl: account.publicProfileWebsiteUrl,
        publicProfileUrl: account.publicProfileSlug
          ? `/leaderboard/profile/${account.publicProfileSlug}`
          : null,
      },
      leaderboard: {
        optIn: account.leaderboardOptIn,
        eligible: Boolean(bestEligibleResult),
        publicProfileVisible: Boolean(
          account.leaderboardOptIn &&
          account.publicProfileEnabled &&
          account.publicProfileSlug &&
          rankedRow,
        ),
        rank: rankedRow?.rank ?? null,
        entry: rankedRow
          ? this.toPublicEntry(rankedRow)
          : bestEligibleResult
            ? this.toPrivateEligibleEntry(bestEligibleResult)
            : null,
      },
    };
  }

  async updateMyPublicProfile(user: RequestUser, dto: UpdatePublicProfileDto) {
    this.assertConsumer(user);

    const account = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        leaderboardDisplayName: true,
        publicProfileEnabled: true,
        publicProfileSlug: true,
      },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    const data: Prisma.UserUpdateInput = {};

    let nextDisplayName = account.leaderboardDisplayName;

    if (this.hasOwn(dto, 'displayName')) {
      nextDisplayName = this.sanitizeDisplayName(dto.displayName);
      data.leaderboardDisplayName = nextDisplayName;
    }

    let nextProfileSlug = account.publicProfileSlug;

    if (this.hasOwn(dto, 'profileSlug')) {
      nextProfileSlug = this.sanitizeProfileSlug(dto.profileSlug);

      if (nextProfileSlug) {
        const existingSlugOwner = await this.prisma.user.findFirst({
          where: {
            publicProfileSlug: nextProfileSlug,
            NOT: {
              id: user.id,
            },
          },
          select: {
            id: true,
          },
        });

        if (existingSlugOwner) {
          throw new BadRequestException('That public profile slug is taken.');
        }
      }

      data.publicProfileSlug = nextProfileSlug;
    }

    if (typeof dto.publicProfileEnabled === 'boolean') {
      data.publicProfileEnabled = dto.publicProfileEnabled;
    }

    if (this.hasOwn(dto, 'headline')) {
      data.publicProfileHeadline = this.sanitizeNullableText(
        dto.headline,
        90,
        'Profile headline',
      );
    }

    if (this.hasOwn(dto, 'bio')) {
      data.publicProfileBio = this.sanitizeNullableText(
        dto.bio,
        600,
        'Profile bio',
      );
    }

    if (this.hasOwn(dto, 'quote')) {
      data.publicProfileQuote = this.sanitizeNullableText(
        dto.quote,
        180,
        'Profile quote',
      );
    }

    if (this.hasOwn(dto, 'location')) {
      data.publicProfileLocation = this.sanitizeNullableText(
        dto.location,
        80,
        'Profile location',
      );
    }

    if (this.hasOwn(dto, 'avatarUrl')) {
      data.publicProfileAvatarUrl = this.sanitizeNullableAvatarUrl(
        dto.avatarUrl,
      );
    }

    if (this.hasOwn(dto, 'websiteUrl')) {
      data.publicProfileWebsiteUrl = this.sanitizeNullableUrl(
        dto.websiteUrl,
        'Website URL',
      );
    }

    const nextPublicProfileEnabled =
      dto.publicProfileEnabled ?? account.publicProfileEnabled;

    if (nextPublicProfileEnabled && !nextProfileSlug) {
      nextProfileSlug = await this.resolveUniqueProfileSlug(
        nextDisplayName ?? `iqmeridian-user-${user.id.slice(0, 8)}`,
        user.id,
      );

      data.publicProfileSlug = nextProfileSlug;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No public profile changes supplied');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data,
    });

    return this.getMyPublicProfile(user);
  }

  private async getRankedLeaderboardRows(limit: number) {
    const scoreResults = await this.prisma.psychometricScoreResult.findMany({
      where: {
        leaderboardEligible: true,
        overallIqScore: {
          not: null,
        },
        validityFlags: {
          none: {
            severity: PsychometricValiditySeverity.HIGH,
          },
        },
        session: {
          user: {
            role: UserRole.CONSUMER,
            leaderboardOptIn: true,
          },
        },
      },
      orderBy: [
        {
          overallIqScore: 'desc',
        },
        {
          overallIqPercentile: 'desc',
        },
        {
          generatedAt: 'asc',
        },
      ],
      take: limit,
      include: {
        session: {
          select: {
            userId: true,
            user: {
              select: {
                leaderboardDisplayName: true,
                publicProfileEnabled: true,
                publicProfileSlug: true,
                publicProfileAvatarUrl: true,
              },
            },
          },
        },
      },
    });

    const bestByUser = new Map<
      string,
      {
        resultId: string;
        userId: string;
        displayName: string;
        profileSlug: string | null;
        avatarUrl: string | null;
        iqScore: number;
        percentile: number | null;
        scoreBand: PsychometricScoreBand;
        generatedAt: Date;
      }
    >();

    for (const scoreResult of scoreResults) {
      const userId = scoreResult.session.userId;

      if (!userId || bestByUser.has(userId) || !scoreResult.overallIqScore) {
        continue;
      }

      const publicProfileEnabled =
        scoreResult.session.user?.publicProfileEnabled ?? false;

      bestByUser.set(userId, {
        resultId: scoreResult.id,
        userId,
        displayName: this.toPublicDisplayName(
          scoreResult.session.user?.leaderboardDisplayName,
        ),
        profileSlug: publicProfileEnabled
          ? (scoreResult.session.user?.publicProfileSlug ?? null)
          : null,
        avatarUrl: publicProfileEnabled
          ? (scoreResult.session.user?.publicProfileAvatarUrl ?? null)
          : null,
        iqScore: scoreResult.overallIqScore,
        percentile: scoreResult.overallIqPercentile,
        scoreBand: scoreResult.overallScoreBand,
        generatedAt: scoreResult.generatedAt,
      });
    }

    return [...bestByUser.values()]
      .sort((left, right) => {
        if (right.iqScore !== left.iqScore) {
          return right.iqScore - left.iqScore;
        }

        if ((right.percentile ?? 0) !== (left.percentile ?? 0)) {
          return (right.percentile ?? 0) - (left.percentile ?? 0);
        }

        return left.generatedAt.getTime() - right.generatedAt.getTime();
      })
      .map<RankedLeaderboardRow>((row, index) => ({
        rank: index + 1,
        ...row,
      }));
  }

  private async getBestEligibleResultForUser(userId: string) {
    return this.prisma.psychometricScoreResult.findFirst({
      where: {
        leaderboardEligible: true,
        overallIqScore: {
          not: null,
        },
        validityFlags: {
          none: {
            severity: PsychometricValiditySeverity.HIGH,
          },
        },
        session: {
          userId,
        },
      },
      orderBy: [
        {
          overallIqScore: 'desc',
        },
        {
          overallIqPercentile: 'desc',
        },
        {
          generatedAt: 'asc',
        },
      ],
    });
  }

  private toProfileSlugSeed(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (slug.length >= 3) {
      return slug.slice(0, 60).replace(/-$/g, '');
    }

    return 'iqmeridian-user';
  }

  private async resolveUniqueProfileSlug(seed: string, userId: string) {
    const baseSlug = this.toProfileSlugSeed(seed);

    for (let attempt = 0; attempt < 25; attempt += 1) {
      const suffix = attempt === 0 ? '' : `-${attempt + 1}`;
      const candidate = `${baseSlug.slice(0, 60 - suffix.length)}${suffix}`;

      const existingOwner = await this.prisma.user.findFirst({
        where: {
          publicProfileSlug: candidate,
          NOT: {
            id: userId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!existingOwner) {
        return candidate;
      }
    }

    return `${baseSlug.slice(0, 45)}-${Date.now().toString(36)}`;
  }

  private sanitizeNullableAvatarUrl(value: string | null | undefined) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      return null;
    }

    if (trimmedValue.length > 500) {
      throw new BadRequestException(
        'Avatar URL must be 500 characters or fewer.',
      );
    }

    if (
      /^\/uploads\/leaderboard-profiles\/[a-zA-Z0-9._-]+$/.test(trimmedValue)
    ) {
      return trimmedValue;
    }

    try {
      const parsedUrl = new URL(trimmedValue);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Unsupported protocol');
      }
    } catch {
      throw new BadRequestException(
        'Avatar must be an uploaded profile image or a valid http(s) URL.',
      );
    }

    return trimmedValue;
  }

  private toPublicEntry(row: RankedLeaderboardRow) {
    return {
      entryId: row.resultId,
      rank: row.rank,
      displayName: row.displayName,
      profileSlug: row.profileSlug,
      avatarUrl: row.avatarUrl,
      iqScore: Math.round(row.iqScore),
      percentile:
        typeof row.percentile === 'number' ? Math.round(row.percentile) : null,
      scoreBand: row.scoreBand,
      generatedAt: row.generatedAt.toISOString(),
    };
  }

  private toPrivateEligibleEntry(
    scoreResult: NonNullable<
      Awaited<ReturnType<LeaderboardService['getBestEligibleResultForUser']>>
    >,
  ) {
    return {
      iqScore: Math.round(scoreResult.overallIqScore ?? 0),
      percentile:
        typeof scoreResult.overallIqPercentile === 'number'
          ? Math.round(scoreResult.overallIqPercentile)
          : null,
      scoreBand: scoreResult.overallScoreBand,
      generatedAt: scoreResult.generatedAt.toISOString(),
    };
  }

  private getEligibilityReasons(input: {
    optIn: boolean;
    hasEligibleResult: boolean;
  }) {
    const reasons: string[] = [];

    if (!input.optIn) {
      reasons.push('Leaderboard public listing is turned off.');
    }

    if (!input.hasEligibleResult) {
      reasons.push(
        'No eligible IQ Score result is available for public ranking yet.',
      );
    }

    return reasons;
  }

  private sanitizeDisplayName(value: string | null | undefined) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      return null;
    }

    if (trimmedValue.length < 2) {
      throw new BadRequestException(
        'Leaderboard display name must be at least 2 characters.',
      );
    }

    if (trimmedValue.length > 40) {
      throw new BadRequestException(
        'Leaderboard display name must be 40 characters or fewer.',
      );
    }

    if (!/^[a-zA-Z0-9 ._-]+$/.test(trimmedValue)) {
      throw new BadRequestException(
        'Leaderboard display name can only contain letters, numbers, spaces, periods, underscores, and hyphens.',
      );
    }

    return trimmedValue;
  }

  private sanitizeProfileSlug(value: string | null | undefined) {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue) {
      return null;
    }

    if (normalizedValue.length < 3) {
      throw new BadRequestException(
        'Public profile slug must be at least 3 characters.',
      );
    }

    if (normalizedValue.length > 60) {
      throw new BadRequestException(
        'Public profile slug must be 60 characters or fewer.',
      );
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedValue)) {
      throw new BadRequestException(
        'Public profile slug may contain lowercase letters, numbers, and hyphens only.',
      );
    }

    return normalizedValue;
  }

  private sanitizeNullableText(
    value: string | null | undefined,
    maxLength: number,
    label: string,
  ) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      return null;
    }

    if (trimmedValue.length > maxLength) {
      throw new BadRequestException(
        `${label} must be ${maxLength} characters or fewer.`,
      );
    }

    return trimmedValue;
  }

  private sanitizeNullableUrl(value: string | null | undefined, label: string) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      return null;
    }

    if (trimmedValue.length > 500) {
      throw new BadRequestException(
        `${label} must be 500 characters or fewer.`,
      );
    }

    try {
      const parsedUrl = new URL(trimmedValue);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Unsupported protocol');
      }
    } catch {
      throw new BadRequestException(`${label} must be a valid http(s) URL.`);
    }

    return trimmedValue;
  }

  private toPublicDisplayName(value: string | null | undefined) {
    return value?.trim() || 'IQMeridian User';
  }

  private resolveLimit(limitInput?: string) {
    if (!limitInput) {
      return DEFAULT_PUBLIC_LIMIT;
    }

    const parsedLimit = Number(limitInput);

    if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
      return DEFAULT_PUBLIC_LIMIT;
    }

    return Math.min(Math.floor(parsedLimit), MAX_PUBLIC_LIMIT);
  }

  private hasOwn<T extends object>(value: T, property: keyof T) {
    return Object.prototype.hasOwnProperty.call(value, property);
  }

  private assertConsumer(user: RequestUser) {
    if (user.role !== UserRole.CONSUMER) {
      throw new ForbiddenException('Leaderboard settings are consumer-only');
    }
  }
}
