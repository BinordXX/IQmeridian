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
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CampaignIdParamDto } from './dto/campaign-route-params.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ListCampaignsQueryDto } from './dto/list-campaigns-query.dto';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';
import { CampaignsService } from './campaigns.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('campaigns')
@UseGuards(DevAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Post()
  createCampaign(
    @Req() req: { user: RequestUser },
    @Body() body: CreateCampaignDto,
  ) {
    return this.campaignsService.createCampaign({
      ...body,
      requestingUser: req.user,
    });
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Get()
  findCampaigns(
    @Req() req: { user: RequestUser },
    @Query() query: ListCampaignsQueryDto,
  ) {
    return this.campaignsService.findCampaignsForUser(req.user, query);
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Get(':id')
  findCampaignById(
    @Param() params: CampaignIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.campaignsService.findCampaignById(params.id, req.user);
  }

  @Roles('PLATFORM_ADMIN', 'EMPLOYER_ADMIN')
  @Patch(':id/status')
  updateCampaignStatus(
    @Param() params: CampaignIdParamDto,
    @Req() req: { user: RequestUser },
    @Body() body: UpdateCampaignStatusDto,
  ) {
    return this.campaignsService.updateCampaignStatus(
      params.id,
      body.status,
      req.user,
    );
  }
}
