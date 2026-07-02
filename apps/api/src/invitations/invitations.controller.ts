import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import {
  InvitationIdParamDto,
  InvitationTokenParamDto,
} from './dto/invitation-route-params.dto';
import { ExtendInvitationDto } from './dto/extend-invitation.dto';
import { InvitationsService } from './invitations.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Post()
  createInvitation(
    @Req() req: { user: RequestUser },
    @Body() body: CreateInvitationDto,
  ) {
    return this.invitationsService.createInvitation({
      ...body,
      requestingUser: req.user,
    });
  }

    @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Post(':id/resend')
  resendInvitation(
    @Param() params: InvitationIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.invitationsService.resendInvitation(params.id, req.user);
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Patch(':id/cancel')
  cancelInvitation(
    @Param() params: InvitationIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.invitationsService.cancelInvitation(params.id, req.user);
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Patch(':id/extend')
  extendInvitation(
    @Param() params: InvitationIdParamDto,
    @Req() req: { user: RequestUser },
    @Body() body: ExtendInvitationDto,
  ) {
    return this.invitationsService.extendInvitation(params.id, body, req.user);
  }
  
    @Roles('CANDIDATE')
  @Get('candidate/pending')
  listPendingCandidateInvitations(@Req() req: { user: RequestUser }) {
    return this.invitationsService.listPendingCandidateInvitations(req.user);
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN', 'CANDIDATE')
  @Get('validate/:token')
  validateInvitation(@Param() params: InvitationTokenParamDto) {
    return this.invitationsService.validateInvitation(params.token);
  }
}
