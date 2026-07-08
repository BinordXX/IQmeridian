import { Body, Controller, Post } from '@nestjs/common';

import { CreateOrganisationAccessRequestDto } from './dto/create-organisation-access-request.dto';
import { OrganisationAccessRequestsService } from './organisation-access-requests.service';

@Controller('organisation-access-requests')
export class OrganisationAccessRequestsController {
  constructor(
    private readonly organisationAccessRequestsService: OrganisationAccessRequestsService,
  ) {}

  @Post()
  create(@Body() dto: CreateOrganisationAccessRequestDto) {
    return this.organisationAccessRequestsService.create(dto);
  }
}