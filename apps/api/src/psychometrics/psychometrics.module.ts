import { Module } from '@nestjs/common';

import { PsychometricsController } from './psychometrics.controller';
import { PsychometricsService } from './psychometrics.service';

@Module({
  controllers: [PsychometricsController],
  providers: [PsychometricsService],
  exports: [PsychometricsService],
})
export class PsychometricsModule {}
