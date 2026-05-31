import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateConsumerSessionDto } from './dto/create-consumer-session.dto';
import { CreateSessionFromInvitationDto } from './dto/create-session-from-invitation.dto';
import { SessionIdParamDto } from './dto/session-route-params.dto';
import { SessionsService } from './sessions.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('sessions')
@UseGuards(DevAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Roles('CONSUMER', 'PLATFORM_ADMIN')
  @Post('consumer')
  createConsumerSession(
    @Req() req: { user: RequestUser },
    @Body() body: CreateConsumerSessionDto,
  ) {
    return this.sessionsService.createConsumerSession({
      userId: req.user.id,
      assessmentFormId: body.assessmentFormId,
    });
  }

  @Roles('CANDIDATE', 'PLATFORM_ADMIN')
  @Post('invitation')
  createSessionFromInvitation(
    @Req() req: { user: RequestUser },
    @Body() body: CreateSessionFromInvitationDto,
  ) {
    return this.sessionsService.createSessionFromInvitation({
      userId: req.user.id,
      invitationToken: body.invitationToken,
    });
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @Post(':id/start')
  startSession(
    @Param() params: SessionIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.sessionsService.startSession(params.id, req.user.id);
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @Post(':id/resume')
  resumeSession(
    @Param() params: SessionIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.sessionsService.resumeSession(params.id, req.user.id);
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @Post(':id/finalise')
  finaliseSession(
    @Param() params: SessionIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.sessionsService.finaliseSession(params.id, req.user.id);
  }
}