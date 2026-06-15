import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserNameDto } from './dto/update-user-name.dto';
import { OrganisationIdParamDto } from './dto/user-route-params.dto';
import { UsersService } from './users.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: { user: RequestUser }) {
    return this.usersService.getCurrentUser(req.user.id);
  }

  @Roles('PLATFORM_ADMIN')
  @Get('organisation/:organisationId')
  getByOrganisation(
    @Param() params: OrganisationIdParamDto,
    @Query() query: ListUsersQueryDto,
  ) {
    return this.usersService.getUsersByOrganisation(
      params.organisationId,
      query,
    );
  }

  @Patch('me')
  updateMe(@Req() req: { user: RequestUser }, @Body() body: UpdateUserNameDto) {
    return this.usersService.updateUserName(req.user.id, body.name);
  }
}
