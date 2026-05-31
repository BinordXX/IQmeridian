import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationTokenParamDto } from './dto/invitation-route-params.dto';
import { InvitationsService } from './invitations.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('invitations')
@UseGuards(DevAuthGuard, RolesGuard)
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

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN', 'CANDIDATE')
  @Get('validate/:token')
  validateInvitation(@Param() params: InvitationTokenParamDto) {
    return this.invitationsService.validateInvitation(params.token);
  }
}