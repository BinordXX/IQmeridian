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
import { CreateItemDto } from './dto/create-item.dto';
import { ItemIdParamDto } from './dto/item-route-params.dto';
import { ListItemsQueryDto } from './dto/list-items-query.dto';
import { UpdateDraftItemDto } from './dto/update-draft-item.dto';
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
    @Body() body: CreateItemDto,
  ) {
    return this.itemBankService.createItem(body, req.user.id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Get()
  listItems(@Query() query: ListItemsQueryDto) {
    return this.itemBankService.listItems(query);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Get(':id')
  getItem(@Param() params: ItemIdParamDto) {
    return this.itemBankService.getItem(params.id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Patch(':id')
  updateDraftItem(
    @Param() params: ItemIdParamDto,
    @Req() req: { user: RequestUser },
    @Body() body: UpdateDraftItemDto,
  ) {
    return this.itemBankService.updateDraftItem(params.id, body, req.user.id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Post(':id/activate')
  activateItem(
    @Param() params: ItemIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.itemBankService.activateItem(params.id, req.user.id);
  }

  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  @Post(':id/retire')
  retireItem(
    @Param() params: ItemIdParamDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.itemBankService.retireItem(params.id, req.user.id);
  }
}