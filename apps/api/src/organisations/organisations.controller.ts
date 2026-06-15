import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/request-user.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AttachEmployerAdminDto } from './dto/attach-employer-admin.dto';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { OrganisationIdParamDto } from './dto/organisation-route-params.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationsService } from './organisations.service';

@Controller('organisations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Roles('PLATFORM_ADMIN')
  @Post()
  createOrganisation(
    @Body() body: CreateOrganisationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organisationsService.createOrganisation(body.name, user.id);
  }

  @Roles('PLATFORM_ADMIN')
  @Get()
  findAllOrganisations() {
    return this.organisationsService.findAllOrganisations();
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Get(':id')
  findOrganisationById(
    @Param() params: OrganisationIdParamDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organisationsService.findOrganisationById(params.id, user);
  }

  @Roles('PLATFORM_ADMIN')
  @Patch(':id')
  updateOrganisation(
    @Param() params: OrganisationIdParamDto,
    @Body() body: UpdateOrganisationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organisationsService.updateOrganisation(
      params.id,
      body.name,
      user.id,
    );
  }

  @Roles('PLATFORM_ADMIN')
  @Post(':id/employer-admins')
  attachEmployerAdmin(
    @Param() params: OrganisationIdParamDto,
    @Body() body: AttachEmployerAdminDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organisationsService.attachEmployerAdminToOrganisation(
      params.id,
      body.userId,
      user.id,
    );
  }
}
