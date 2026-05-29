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
import { CampaignStatus } from '@prisma/client';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CampaignsService } from './campaigns.service';

@Controller('campaigns')
@UseGuards(DevAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Post()
  createCampaign(
    @Req()
    req: {
      user: { id: string; role: string; organisationId?: string | null };
    },
    @Body()
    body: {
      name: string;
      organisationId: string;
      ownerId?: string;
      assessmentFormId?: string;
    },
  ) {
    return this.campaignsService.createCampaign({
      ...body,
      requestingUser: req.user,
    });
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Get()
  findCampaigns(
    @Req()
    req: {
      user: { role: string; organisationId?: string | null };
    },
  ) {
    return this.campaignsService.findCampaignsForUser(req.user);
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Get(':id')
  findCampaignById(
    @Param('id') id: string,
    @Req()
    req: {
      user: { role: string; organisationId?: string | null };
    },
  ) {
    return this.campaignsService.findCampaignById(id, req.user);
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Patch(':id/status')
  updateCampaignStatus(
    @Param('id') id: string,
    @Req()
    req: {
      user: { role: string; organisationId?: string | null };
    },
    @Body() body: { status: CampaignStatus },
  ) {
    return this.campaignsService.updateCampaignStatus(
      id,
      body.status,
      req.user,
    );
  }
}