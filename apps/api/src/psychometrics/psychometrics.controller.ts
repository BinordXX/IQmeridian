import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PsychometricsService } from './psychometrics.service';

@Controller('internal/psychometrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'RESEARCHER')
export class PsychometricsController {
  constructor(private readonly psychometricsService: PsychometricsService) {}

  @Get('health')
  getHealth() {
    return this.psychometricsService.getHealth();
  }

  @Get('version')
  getVersion() {
    return this.psychometricsService.getVersion();
  }

  @Get('capabilities')
  getCapabilities() {
    return this.psychometricsService.getCapabilities();
  }

  @Post('sessions/:sessionId/score')
  scoreSession(@Param('sessionId') sessionId: string) {
    return this.psychometricsService.scoreSession(sessionId);
  }

  @Get('sessions/:sessionId/score')
  getSessionScore(@Param('sessionId') sessionId: string) {
    return this.psychometricsService.getSessionScore(sessionId);
  }
}
