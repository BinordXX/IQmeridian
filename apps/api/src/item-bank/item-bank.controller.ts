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
import { AssessmentDomain, ItemStatus } from '@prisma/client';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ItemBankService } from './item-bank.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('item-bank')
@UseGuards(DevAuthGuard, RolesGuard)
export class ItemBankController {
  constructor(private readonly itemBankService: ItemBankService) {}

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Post()
  createItem(
    @Req() req: { user: RequestUser },
    @Body()
    body: {
      domain: AssessmentDomain;
      prompt: string;
      itemType: string;
      options?: unknown;
      correctAnswer?: unknown;
      difficulty?: string;
    },
  ) {
    return this.itemBankService.createItem(body, req.user.id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Get()
  listItems(
    @Query('domain') domain?: AssessmentDomain,
    @Query('status') status?: ItemStatus,
    @Query('formId') formId?: string,
  ) {
    return this.itemBankService.listItems({ domain, status, formId });
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Get(':id')
  getItem(@Param('id') id: string) {
    return this.itemBankService.getItem(id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Patch(':id')
  updateDraftItem(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Body()
    body: {
      prompt?: string;
      itemType?: string;
      options?: unknown;
      correctAnswer?: unknown;
      difficulty?: string;
    },
  ) {
    return this.itemBankService.updateDraftItem(id, body, req.user.id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Post(':id/activate')
  activateItem(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    return this.itemBankService.activateItem(id, req.user.id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Post(':id/retire')
  retireItem(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    return this.itemBankService.retireItem(id, req.user.id);
  }
}