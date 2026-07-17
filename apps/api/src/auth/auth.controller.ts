import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequestUser } from './request-user.type';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AcceptOrganisationAdminInvitationDto } from './dto/accept-organisation-admin-invitation.dto';
import { ResendEmailVerificationDto } from './dto/resend-email-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import type { Request } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type RequestMetadataSource = {
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  headers: Record<string, string | string[] | undefined>;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('organisation-admin-invitations/:token')
  getOrganisationAdminInvitation(@Param('token') token: string) {
    return this.authService.getOrganisationAdminInvitationByToken(token);
  }

  @Post('organisation-admin-invitations/:token/accept')
  acceptOrganisationAdminInvitation(
    @Param('token') token: string,
    @Body() dto: AcceptOrganisationAdminInvitationDto,
    @Req() request: Request,
  ) {
    return this.authService.acceptOrganisationAdminInvitation(
      token,
      dto,
      this.getRequestMetadata(request),
    );
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-email-verification')
  resendEmailVerification(
    @Body() dto: ResendEmailVerificationDto,
    @Req() request: Request,
  ) {
    return this.authService.resendEmailVerification(
      dto,
      this.getRequestMetadata(request),
    );
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    return this.authService.forgotPassword(
      dto,
      this.getRequestMetadata(request),
    );
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    return this.authService.resetPassword(
      dto,
      this.getRequestMetadata(request),
    );
  }
  @Post('register')
  register(@Body() body: RegisterDto, @Req() request: RequestMetadataSource) {
    return this.authService.register(body, this.getRequestMetadata(request));
  }

  @Post('register/candidate')
  registerCandidate(
    @Body() body: RegisterCandidateDto,
    @Req() request: RequestMetadataSource,
  ) {
    return this.authService.registerCandidate(
      body,
      this.getRequestMetadata(request),
    );
  }

  @Post('login')
  login(@Body() body: LoginDto, @Req() request: RequestMetadataSource) {
    return this.authService.login(body, this.getRequestMetadata(request));
  }

  @Post('refresh')
  refresh(
    @Body() body: RefreshTokenDto,
    @Req() request: RequestMetadataSource,
  ) {
    return this.authService.refresh(body, this.getRequestMetadata(request));
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: RequestUser, @Body() body: LogoutDto) {
    return this.authService.logout(user, body);
  }
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: RequestUser,
    @Body() body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user);
  }

  private getRequestMetadata(request: RequestMetadataSource) {
    return {
      ipAddress:
        this.firstHeaderValue(request.headers['x-forwarded-for'])
          ?.split(',')[0]
          ?.trim() ??
        request.ip ??
        request.socket?.remoteAddress,
      userAgent: this.firstHeaderValue(request.headers['user-agent']),
    };
  }

  private firstHeaderValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
  }
}
