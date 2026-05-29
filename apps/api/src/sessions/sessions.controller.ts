import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(DevAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Roles('CONSUMER', 'PLATFORM_ADMIN')
  @Post('consumer')
  createConsumerSession(
    @Req() req: { user: { id: string } },
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
    @Req() req: { user: { id: string } },
    @Body() body: { invitationToken: string },
  ) {
    return this.sessionsService.createSessionFromInvitation({
      userId: req.user.id,
      invitationToken: body.invitationToken,
    });
  }

  @Post(':id/start')
  startSession(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.sessionsService.startSession(id, req.user.id);
  }

  @Post(':id/resume')
  resumeSession(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.sessionsService.resumeSession(id, req.user.id);
  }

  @Post(':id/finalise')
  finaliseSession(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.sessionsService.finaliseSession(id, req.user.id);
  }
}