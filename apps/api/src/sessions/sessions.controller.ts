import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
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
    @Body() body: { assessmentFormId: string },
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
    @Body() body: { invitationToken: string },
  ) {
    return this.sessionsService.createSessionFromInvitation({
      userId: req.user.id,
      invitationToken: body.invitationToken,
    });
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @Post(':id/start')
  startSession(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    return this.sessionsService.startSession(id, req.user.id);
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @Post(':id/resume')
  resumeSession(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    return this.sessionsService.resumeSession(id, req.user.id);
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @Post(':id/finalise')
  finaliseSession(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
  ) {
    return this.sessionsService.finaliseSession(id, req.user.id);
  }
}