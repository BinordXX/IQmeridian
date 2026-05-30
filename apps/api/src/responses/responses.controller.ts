import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ResponsesService } from './responses.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('responses')
@UseGuards(DevAuthGuard, RolesGuard)
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @Post('sessions/:sessionId/items/:itemId')
  saveItemResponse(
    @Param('sessionId') sessionId: string,
    @Param('itemId') itemId: string,
    @Req() req: { user: RequestUser },
    @Body() body: { answer: unknown },
  ) {
    return this.responsesService.saveItemResponse({
      sessionId,
      itemId,
      user: req.user,
      answer: body.answer,
    });
  }

  @Roles('CANDIDATE', 'CONSUMER', 'EMPLOYER_ADMIN', 'PLATFORM_ADMIN')
  @Get('sessions/:sessionId')
  getSessionResponses(
    @Param('sessionId') sessionId: string,
    @Req() req: { user: RequestUser },
  ) {
    return this.responsesService.getSessionResponses(sessionId, req.user);
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @Post('sessions/:sessionId/finalise')
  finaliseResponseSet(
    @Param('sessionId') sessionId: string,
    @Req() req: { user: RequestUser },
  ) {
    return this.responsesService.finaliseResponseSet(sessionId, req.user);
  }
}