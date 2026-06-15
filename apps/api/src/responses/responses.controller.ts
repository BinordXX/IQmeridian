import {
  Body,
  Controller,
  Get,
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
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
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
