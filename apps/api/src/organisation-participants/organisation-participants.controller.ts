import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ParticipantIdParamDto } from './dto/participant-route-params.dto';
import { UpdateParticipantStatusDto } from './dto/update-participant-status.dto';
import { OrganisationParticipantsService } from './organisation-participants.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('organisation-participants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganisationParticipantsController {
  constructor(
    private readonly organisationParticipantsService: OrganisationParticipantsService,
  ) {}

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Get()
  listParticipants(@Req() req: { user: RequestUser }) {
    return this.organisationParticipantsService.listParticipants(req.user);
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Patch(':id/status')
  updateParticipantStatus(
    @Param() params: ParticipantIdParamDto,
    @Body() body: UpdateParticipantStatusDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.organisationParticipantsService.updateParticipantStatus(
      params.id,
      body,
      req.user,
    );
  }
}
