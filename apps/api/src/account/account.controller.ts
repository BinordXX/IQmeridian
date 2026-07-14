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
import { AccountService } from './account.service';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateAccountNotificationPreferencesDto } from './dto/update-account-notification-preferences.dto';
import { UpdateAccountProfileDto } from './dto/update-account-profile.dto';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: RequestUser) {
    return this.accountService.getProfile(user);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() body: UpdateAccountProfileDto,
  ) {
    return this.accountService.updateProfile(user, body);
  }

  @Get('notification-preferences')
  getNotificationPreferences(@CurrentUser() user: RequestUser) {
    return this.accountService.getNotificationPreferences(user);
  }

  @Patch('notification-preferences')
  updateNotificationPreferences(
    @CurrentUser() user: RequestUser,
    @Body() body: UpdateAccountNotificationPreferencesDto,
  ) {
    return this.accountService.updateNotificationPreferences(user, body);
  }

  @Get('sessions')
  listAuthSessions(@CurrentUser() user: RequestUser) {
    return this.accountService.listAuthSessions(user);
  }

  @Patch('sessions/:sessionId/revoke')
  revokeAuthSession(
    @CurrentUser() user: RequestUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.accountService.revokeAuthSession(user, sessionId);
  }

  @Post('sessions/revoke-others')
  revokeOtherAuthSessions(@CurrentUser() user: RequestUser) {
    return this.accountService.revokeOtherAuthSessions(user);
  }

  @Post('delete')
  deleteAccount(
    @CurrentUser() user: RequestUser,
    @Body() body: DeleteAccountDto,
  ) {
    return this.accountService.deleteAccount(user, body);
  }
}
