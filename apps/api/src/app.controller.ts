import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { DevAuthGuard } from './auth/dev-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @UseGuards(DevAuthGuard)
  @Get('protected')
  getProtected(@Req() req: { user: { email: string; role: string } }) {
    return {
      status: 'ok',
      message: 'Protected endpoint reached',
      user: req.user,
    };
  }
}