import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ScoreSessionParamDto } from './dto/scoring-route-params.dto';
import { ScoringService } from './scoring.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('scoring')
@UseGuards(DevAuthGuard, RolesGuard)
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Roles('CANDIDATE', 'CONSUMER', 'EMPLOYER_ADMIN', 'PLATFORM_ADMIN')
  @Post('sessions/:sessionId')
  scoreSession(
    @Param() params: ScoreSessionParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.scoringService.scoreCompletedSession(
      params.sessionId,
      req.user,
    );
  }

  @Roles('CANDIDATE', 'CONSUMER', 'EMPLOYER_ADMIN', 'PLATFORM_ADMIN')
  @Get('sessions/:sessionId')
  getSessionScore(
    @Param() params: ScoreSessionParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.scoringService.getSessionScore(params.sessionId, req.user);
  }
}