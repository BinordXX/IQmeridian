import { Module } from '@nestjs/common';

import { PsychometricScorePersistenceService } from './psychometric-score-persistence.service';
import { PsychometricScoringClientService } from './psychometric-scoring-client.service';
import { PsychometricScoringRequestBuilderService } from './psychometric-scoring-request-builder.service';
import { PsychometricsController } from './psychometrics.controller';
import { PsychometricsService } from './psychometrics.service';

@Module({
  controllers: [PsychometricsController],
  providers: [
    PsychometricsService,
    PsychometricScorePersistenceService,
    PsychometricScoringClientService,
    PsychometricScoringRequestBuilderService,
  ],
  exports: [
    PsychometricsService,
    PsychometricScorePersistenceService,
    PsychometricScoringClientService,
    PsychometricScoringRequestBuilderService,
  ],
})
export class PsychometricsModule {}
