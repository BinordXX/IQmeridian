import { Controller, Get, Param, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(DevAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: { user: { id: string } }) {
    return this.usersService.getCurrentUser(req.user.id);
  }

  @Roles('PLATFORM_ADMIN')
  @Get('organisation/:organisationId')
  getByOrganisation(@Param('organisationId') organisationId: string) {
    return this.usersService.getUsersByOrganisation(organisationId);
  }

  @Patch('me')
  updateMe(
    @Req() req: { user: { id: string } },
    @Body() body: { name: string },
  ) {
    return this.usersService.updateUserName(req.user.id, body.name);
  }
}
