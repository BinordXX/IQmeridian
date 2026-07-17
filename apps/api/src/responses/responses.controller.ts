import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SaveItemResponseDto } from './dto/save-item-response.dto';
import {
  SessionIdParamDto,
  SessionItemParamDto,
} from './dto/response-route-params.dto';
import { ResponsesService } from './responses.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post('public/sessions/:sessionId/items/:itemId')
  savePublicItemResponse(
    @Param() params: SessionItemParamDto,
    @Headers('x-assessment-session-token')
    sessionAccessToken: string | undefined,
    @Body() body: SaveItemResponseDto,
  ) {
    return this.responsesService.saveItemResponse({
      sessionId: params.sessionId,
      itemId: params.itemId,
      sessionAccessToken,
      answer: body.answer,
    });
  }

  @Get('public/sessions/:sessionId')
  getPublicSessionResponses(
    @Param() params: SessionIdParamDto,
    @Headers('x-assessment-session-token') sessionAccessToken?: string,
  ) {
    return this.responsesService.getSessionResponsesWithAccessToken(
      params.sessionId,
      sessionAccessToken,
    );
  }

  @Post('public/sessions/:sessionId/finalise')
  finalisePublicResponseSet(
    @Param() params: SessionIdParamDto,
    @Headers('x-assessment-session-token') sessionAccessToken?: string,
  ) {
    return this.responsesService.finaliseResponseSetWithAccessToken(
      params.sessionId,
      sessionAccessToken,
    );
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('sessions/:sessionId/items/:itemId')
  saveItemResponse(
    @Param() params: SessionItemParamDto,
    @Req() req: { user: RequestUser },
    @Body() body: SaveItemResponseDto,
  ) {
    return this.responsesService.saveItemResponse({
      sessionId: params.sessionId,
      itemId: params.itemId,
      user: req.user,
      answer: body.answer,
    });
  }

  @Roles('CANDIDATE', 'CONSUMER', 'EMPLOYER_ADMIN', 'PLATFORM_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('sessions/:sessionId')
  getSessionResponses(
    @Param() params: SessionIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.responsesService.getSessionResponses(
      params.sessionId,
      req.user,
    );
  }

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('sessions/:sessionId/finalise')
  finaliseResponseSet(
    @Param() params: SessionIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.responsesService.finaliseResponseSet(
      params.sessionId,
      req.user,
    );
  }
}
