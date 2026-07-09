import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateOrganisationAccessRequestDto } from './dto/create-organisation-access-request.dto';
import { OrganisationAccessRequestIdParamDto } from './dto/organisation-access-request-route-params.dto';
import { ReviewOrganisationAccessRequestDto } from './dto/review-organisation-access-request.dto';
import { OrganisationAccessRequestsService } from './organisation-access-requests.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

type RequestWithUser = {
  user: RequestUser;
};

@Controller('organisation-access-requests')
export class OrganisationAccessRequestsController {
  constructor(
    private readonly organisationAccessRequestsService: OrganisationAccessRequestsService,
  ) {}

  @Post()
  create(@Body() dto: CreateOrganisationAccessRequestDto) {
    return this.organisationAccessRequestsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  list(@Query('status') status?: string) {
    return this.organisationAccessRequestsService.list(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  getById(@Param() params: OrganisationAccessRequestIdParamDto) {
    return this.organisationAccessRequestsService.getById(params.id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  review(
    @Param() params: OrganisationAccessRequestIdParamDto,
    @Body() dto: ReviewOrganisationAccessRequestDto,
    @Req() request: RequestWithUser,
  ) {
    return this.organisationAccessRequestsService.review(
      params.id,
      dto,
      request.user,
    );
  }
    @Post(':id/convert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  convert(
    @Param() params: OrganisationAccessRequestIdParamDto,
    @Req() request: RequestWithUser,
  ) {
    return this.organisationAccessRequestsService.convert(
      params.id,
      request.user,
    );
  }
    @Post(':id/resend-admin-invitation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  resendAdminInvitationEmail(
    @Param() params: OrganisationAccessRequestIdParamDto,
    @Req() request: RequestWithUser,
  ) {
    return this.organisationAccessRequestsService.resendAdminInvitationEmail(
      params.id,
      request.user,
    );
  }
}

