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
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { OrganisationsService } from './organisations.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('organisations')
@UseGuards(DevAuthGuard, RolesGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Roles('PLATFORM_ADMIN')
  @Post()
  createOrganisation(
    @Body() body: { name: string },
    @Req() req: { user: RequestUser },
  ) {
    return this.organisationsService.createOrganisation(body.name, req.user.id);
  }

  @Roles('PLATFORM_ADMIN')
  @Get()
  findAllOrganisations() {
    return this.organisationsService.findAllOrganisations();
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Get(':id')
  findOrganisationById(@Param('id') id: string) {
    return this.organisationsService.findOrganisationById(id);
  }

  @Roles('PLATFORM_ADMIN')
  @Patch(':id')
  updateOrganisation(
    @Param('id') id: string,
    @Body() body: { name: string },
    @Req() req: { user: RequestUser },
  ) {
    return this.organisationsService.updateOrganisation(
      id,
      body.name,
      req.user.id,
    );
  }

  @Roles('PLATFORM_ADMIN')
  @Post(':id/employer-admins')
  attachEmployerAdmin(
    @Param('id') id: string,
    @Body() body: { userId: string },
    @Req() req: { user: RequestUser },
  ) {
    return this.organisationsService.attachEmployerAdminToOrganisation(
      id,
      body.userId,
      req.user.id,
    );
  }
}