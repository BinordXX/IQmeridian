import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateLeaderboardPreferencesDto } from './dto/update-leaderboard-preferences.dto';
import { UpdatePublicProfileDto } from './dto/update-public-profile.dto';
import { LeaderboardService } from './leaderboard.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  getPublicLeaderboard(@Query('limit') limit?: string) {
    return this.leaderboardService.getPublicLeaderboard(limit);
  }

  @Get('profiles/:slug')
  getPublicProfile(@Param('slug') slug: string) {
    return this.leaderboardService.getPublicProfile(slug);
  }

  @Roles(UserRole.CONSUMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  getMyLeaderboardSummary(@Req() req: { user: RequestUser }) {
    return this.leaderboardService.getMyLeaderboardSummary(req.user);
  }

  @Roles(UserRole.CONSUMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('me')
  updateMyLeaderboardPreferences(
    @Req() req: { user: RequestUser },
    @Body() dto: UpdateLeaderboardPreferencesDto,
  ) {
    return this.leaderboardService.updateMyLeaderboardPreferences(
      req.user,
      dto,
    );
  }

  @Roles(UserRole.CONSUMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me/profile')
  getMyPublicProfile(@Req() req: { user: RequestUser }) {
    return this.leaderboardService.getMyPublicProfile(req.user);
  }

  @Roles(UserRole.CONSUMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('me/profile')
  updateMyPublicProfile(
    @Req() req: { user: RequestUser },
    @Body() dto: UpdatePublicProfileDto,
  ) {
    return this.leaderboardService.updateMyPublicProfile(req.user, dto);
  }
}
