import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequestUser } from './request-user.type';

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

  @Post('register')
  register(@Body() body: RegisterDto, @Req() request: RequestMetadataSource) {
    return this.authService.register(body, this.getRequestMetadata(request));
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
