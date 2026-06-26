import { Module } from '@nestjs/common';
import { PsychometricScorePersistenceService } from './psychometric-score-persistence.service';
import { PsychometricsController } from './psychometrics.controller';
import { PsychometricsService } from './psychometrics.service';

@Module({
  controllers: [PsychometricsController],
  providers: [PsychometricsService, PsychometricScorePersistenceService],
  exports: [PsychometricsService, PsychometricScorePersistenceService],
})
export class PsychometricsModule {}
