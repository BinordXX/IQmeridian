import { Injectable } from '@nestjs/common';
import {
  Prisma,
  PsychometricScoreBand as PrismaPsychometricScoreBand,
  PsychometricScoringMode as PrismaPsychometricScoringMode,
  PsychometricScoringStatus as PrismaPsychometricScoringStatus,
  PsychometricValiditySeverity as PrismaPsychometricValiditySeverity,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type {
  PsychometricDomainScore,
  PsychometricScoringResponse,
  PsychometricValidityFlag,
} from './psychometric-scoring-contract.types';

@Injectable()
export class PsychometricScorePersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertSessionScore(response: PsychometricScoringResponse) {
    const resultData = this.toResultData(response);

    return this.prisma.$transaction(async (tx) => {
      const existingResult = await tx.psychometricScoreResult.findUnique({
        where: { sessionId: response.sessionId },
        select: { id: true },
      });

      if (existingResult) {
        await tx.psychometricValidityFlag.deleteMany({
          where: { resultId: existingResult.id },
        });

        await tx.psychometricDomainScore.deleteMany({
          where: { resultId: existingResult.id },
        });
      }

      return tx.psychometricScoreResult.upsert({
        where: { sessionId: response.sessionId },
        create: {
          sessionId: response.sessionId,
          ...resultData,
          domainScores: {
            create: response.domains.map((domainScore) =>
              this.toDomainScoreData(domainScore),
            ),
          },
          validityFlags: {
            create: response.validityFlags.map((flag) =>
              this.toValidityFlagData(flag),
            ),
          },
        },
        update: {
          ...resultData,
          domainScores: {
            create: response.domains.map((domainScore) =>
              this.toDomainScoreData(domainScore),
            ),
          },
          validityFlags: {
            create: response.validityFlags.map((flag) =>
              this.toValidityFlagData(flag),
            ),
          },
        },
        include: {
          domainScores: {
            orderBy: { domain: 'asc' },
          },
          validityFlags: {
            orderBy: [{ severity: 'desc' }, { code: 'asc' }],
          },
        },
      });
    });
  }

  async getSessionScore(sessionId: string) {
    return this.prisma.psychometricScoreResult.findUnique({
      where: { sessionId },
      include: {
        domainScores: {
          orderBy: { domain: 'asc' },
        },
        validityFlags: {
          orderBy: [{ severity: 'desc' }, { code: 'asc' }],
        },
      },
    });
  }

  async deleteSessionScore(sessionId: string) {
    return this.prisma.psychometricScoreResult.deleteMany({
      where: { sessionId },
    });
  }

  private toResultData(response: PsychometricScoringResponse) {
    return {
      contractVersion: response.contractVersion,
      scoringStatus: response.scoringStatus as PrismaPsychometricScoringStatus,

      overallRawScore: response.overall.rawScore,
      overallMaxRawScore: response.overall.maxRawScore,
      overallAccuracy: response.overall.accuracy,
      overallTheta: response.overall.theta,
      overallStandardScore: response.overall.standardScore,
      overallPercentile: response.overall.percentile,
      overallScoreBand: response.overall
        .scoreBand as PrismaPsychometricScoreBand,
      overallStandardError: response.overall.standardError,
      overallCi90Lower: response.overall.confidenceInterval90.lower,
      overallCi90Upper: response.overall.confidenceInterval90.upper,
      overallTestInformation: response.overall.testInformation,
      overallReliability: response.overall.reliability,
      overallInterpretation: response.overall.interpretation,

      timingTotalResponseTimeMs: response.timingProfile.totalResponseTimeMs,
      timingMedianResponseTimeMs: response.timingProfile.medianResponseTimeMs,
      timingSpeedIndex: response.timingProfile.speedIndex,
      timingSpeedAccuracyTradeoff: response.timingProfile.speedAccuracyTradeoff,
      timingRapidGuessingRate: response.timingProfile.rapidGuessingRate,
      timingOmissionRate: response.timingProfile.omissionRate,

      modelVersion: response.audit.modelVersion,
      calibrationVersion: response.audit.calibrationVersion,
      scoringModeUsed: response.audit
        .scoringModeUsed as PrismaPsychometricScoringMode,
      generatedAt: new Date(response.audit.generatedAt),
      inputHash: response.audit.inputHash,
      warnings: response.audit.warnings as Prisma.InputJsonValue,
    };
  }

  private toDomainScoreData(domainScore: PsychometricDomainScore) {
    return {
      domain: domainScore.domain,
      label: domainScore.label,
      rawScore: domainScore.rawScore,
      maxRawScore: domainScore.maxRawScore,
      accuracy: domainScore.accuracy,
      theta: domainScore.theta,
      standardScore: domainScore.standardScore,
      percentile: domainScore.percentile,
      scoreBand: domainScore.scoreBand as PrismaPsychometricScoreBand,
      standardError: domainScore.standardError,
      ci90Lower: domainScore.confidenceInterval90.lower,
      ci90Upper: domainScore.confidenceInterval90.upper,
      testInformation: domainScore.testInformation,
      reliability: domainScore.reliability,
      interpretation: domainScore.interpretation,
    };
  }

  private toValidityFlagData(flag: PsychometricValidityFlag) {
    return {
      code: flag.code,
      label: flag.label,
      severity: flag.severity as PrismaPsychometricValiditySeverity,
      description: flag.description,
      evidence: flag.evidence as Prisma.InputJsonValue,
    };
  }
}
