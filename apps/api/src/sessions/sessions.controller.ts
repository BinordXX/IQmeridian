import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateConsumerSessionDto } from './dto/create-consumer-session.dto';
import { CreateSessionFromInvitationDto } from './dto/create-session-from-invitation.dto';
import { ExchangeResultAccessTokenDto } from './dto/exchange-result-access-token.dto';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { SessionIdParamDto } from './dto/session-route-params.dto';
import { SessionsService } from './sessions.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Roles('CANDIDATE', 'CONSUMER', 'EMPLOYER_ADMIN', 'PLATFORM_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  listSessions(
    @Req() req: { user: RequestUser },
    @Query() query: ListSessionsQueryDto,
  ) {
    return this.sessionsService.listSessions(req.user, query);
  }

  @Roles('CONSUMER', 'PLATFORM_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('consumer')
  createConsumerSession(
    @Req() req: { user: RequestUser },
    @Body() body: CreateConsumerSessionDto = {},
  ) {
    return this.sessionsService.createConsumerSession({
      userId: req.user.id,
      assessmentFormId: body.assessmentFormId,
    });
  }

  @Post('invitation')
  createSessionFromInvitation(@Body() body: CreateSessionFromInvitationDto) {
    return this.sessionsService.createSessionFromInvitation({
      invitationToken: body.invitationToken,
      applicantName: body.applicantName,
      consentAccepted: body.consentAccepted,
    });
  }

  @Post('result-access')
  exchangeResultAccessToken(@Body() body: ExchangeResultAccessTokenDto) {
    return this.sessionsService.exchangeCandidateResultAccessToken(body.token);
  }

  @Post('public/:id/start')
  startPublicSession(
    @Param() params: SessionIdParamDto,
    @Headers('x-assessment-session-token') sessionAccessToken?: string,
  ) {
    return this.sessionsService.startSessionWithAccessToken(
      params.id,
      sessionAccessToken,
    );
  }

  @Post('public/:id/resume')
  resumePublicSession(
    @Param() params: SessionIdParamDto,
    @Headers('x-assessment-session-token') sessionAccessToken?: string,
  ) {
    return this.sessionsService.resumeSessionWithAccessToken(
      params.id,
      sessionAccessToken,
    );
  }

  @Post('public/:id/finalise')
  finalisePublicSession(
    @Param() params: SessionIdParamDto,
    @Headers('x-assessment-session-token') sessionAccessToken?: string,
  ) {
    return this.sessionsService.finaliseSessionWithAccessToken(
      params.id,
      sessionAccessToken,
    );
  }

  @Get('public/:id/candidate-summary')
  getPublicCandidateResultSummary(
    @Param() params: SessionIdParamDto,
    @Headers('x-assessment-session-token') sessionAccessToken?: string,
  ) {
    return this.sessionsService.getPublicCandidateResultSummary(
      params.id,
      sessionAccessToken,
    );
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/start')
  startSession(
    @Param() params: SessionIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.sessionsService.startSession(params.id, req.user.id);
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/resume')
  resumeSession(
    @Param() params: SessionIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.sessionsService.resumeSession(params.id, req.user.id);
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/finalise')
  finaliseSession(
    @Param() params: SessionIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.sessionsService.finaliseSession(params.id, req.user.id);
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/candidate-summary')
  getCandidateResultSummary(
    @Param() params: SessionIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.sessionsService.getCandidateResultSummary(
      params.id,
      req.user.id,
    );
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN', 'RESEARCHER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/psychometric-score')
  getSessionPsychometricScore(
    @Param() params: SessionIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.sessionsService.getSessionPsychometricScore(
      params.id,
      req.user,
    );
  }
}
