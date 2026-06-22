import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/request-user.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserNameDto } from './dto/update-user-name.dto';
import { UpdateUserOrganisationDto } from './dto/update-user-organisation.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import {
  OrganisationIdParamDto,
  UserIdParamDto,
} from './dto/user-route-params.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.getCurrentUser(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: RequestUser, @Body() body: UpdateUserNameDto) {
    return this.usersService.updateUserName(user.id, body.name);
  }

  @Roles('PLATFORM_ADMIN')
  @Get()
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.listUsers(query);
  }

  @Roles('PLATFORM_ADMIN')
  @Post()
  createManagedUser(
    @CurrentUser() actor: RequestUser,
    @Body() body: CreateManagedUserDto,
  ) {
    return this.usersService.createManagedUser({
      actor,
      input: body,
    });
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

  @Roles('PLATFORM_ADMIN')
  @Get(':userId')
  getUserById(@Param() params: UserIdParamDto) {
    return this.usersService.getUserById(params.userId);
  }

  @Roles('PLATFORM_ADMIN')
  @Patch(':userId/role')
  updateUserRole(
    @CurrentUser() actor: RequestUser,
    @Param() params: UserIdParamDto,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole({
      actor,
      userId: params.userId,
      role: body.role,
    });
  }

  @Roles('PLATFORM_ADMIN')
  @Patch(':userId/status')
  updateUserStatus(
    @CurrentUser() actor: RequestUser,
    @Param() params: UserIdParamDto,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.usersService.updateUserStatus({
      actor,
      userId: params.userId,
      status: body.status,
    });
  }

  @Roles('PLATFORM_ADMIN')
  @Patch(':userId/organisation')
  updateUserOrganisation(
    @CurrentUser() actor: RequestUser,
    @Param() params: UserIdParamDto,
    @Body() body: UpdateUserOrganisationDto,
  ) {
    return this.usersService.updateUserOrganisation({
      actor,
      userId: params.userId,
      organisationId: body.organisationId ?? null,
    });
  }
}
