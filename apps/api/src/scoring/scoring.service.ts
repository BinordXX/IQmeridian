import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentDomain,
  FormItemMappingStatus,
  Prisma,
  SessionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

type DomainAccumulator = {
  rawScore: number;
  maxScore: number;
};

const SCORING_VERSION = 1;

@Injectable()
export class ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  async scoreCompletedSession(sessionId: string, user: RequestUser) {
    const session = await this.getSessionOrThrow(sessionId);

    this.assertUserCanAccessSession(session, user);

    if (session.status !== SessionStatus.COMPLETED) {
      throw new BadRequestException(
        'Only completed sessions can be scored',
      );
    }

    const mappings = await this.prisma.formItemMapping.findMany({
      where: {
        formId: session.assessmentFormId,
        status: FormItemMappingStatus.ACTIVE,
      },
      include: {
        item: true,
        section: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    if (mappings.length === 0) {
      throw new BadRequestException(
        'Cannot score session because the assigned form has no active items',
      );
    }

    const responses = await this.prisma.response.findMany({
      where: {
        sessionId,
      },
    });

    const responseByItemId = new Map(
      responses.map((response) => [response.itemId, response]),
    );

    const domainScores: Record<AssessmentDomain, DomainAccumulator> = {
      [AssessmentDomain.ABSTRACT_REASONING]: {
        rawScore: 0,
        maxScore: 0,
      },
      [AssessmentDomain.NUMERICAL_REASONING]: {
        rawScore: 0,
        maxScore: 0,
      },
    };

    for (const mapping of mappings) {
      const item = mapping.item;

      if (item.correctAnswer === null || item.correctAnswer === undefined) {
        continue;
      }

      const domain = item.domain;
      domainScores[domain].maxScore += 1;

      const response = responseByItemId.get(item.id);

      if (!response) {
        continue;
      }

      if (this.answersMatch(response.answer, item.correctAnswer)) {
        domainScores[domain].rawScore += 1;
      }
    }

    const abstractRawScore =
      domainScores[AssessmentDomain.ABSTRACT_REASONING].rawScore;
    const abstractMaxScore =
      domainScores[AssessmentDomain.ABSTRACT_REASONING].maxScore;

    const numericalRawScore =
      domainScores[AssessmentDomain.NUMERICAL_REASONING].rawScore;
    const numericalMaxScore =
      domainScores[AssessmentDomain.NUMERICAL_REASONING].maxScore;

    const overallRawScore = abstractRawScore + numericalRawScore;
    const overallMaxScore = abstractMaxScore + numericalMaxScore;

    if (overallMaxScore === 0) {
      throw new BadRequestException(
        'Cannot score session because no mapped items have correct answers',
      );
    }

    const overallComposite = Number(
      ((overallRawScore / overallMaxScore) * 100).toFixed(2),
    );

    const abstractBand = this.mapBand(abstractRawScore, abstractMaxScore);
    const numericalBand = this.mapBand(numericalRawScore, numericalMaxScore);
    const overallBand = this.mapBand(overallRawScore, overallMaxScore);

    const domainScorePayload: Prisma.InputJsonObject = {
      [AssessmentDomain.ABSTRACT_REASONING]: {
        rawScore: abstractRawScore,
        maxScore: abstractMaxScore,
        composite:
          abstractMaxScore > 0
            ? Number(((abstractRawScore / abstractMaxScore) * 100).toFixed(2))
            : null,
        band: abstractBand,
      },
      [AssessmentDomain.NUMERICAL_REASONING]: {
        rawScore: numericalRawScore,
        maxScore: numericalMaxScore,
        composite:
          numericalMaxScore > 0
            ? Number(((numericalRawScore / numericalMaxScore) * 100).toFixed(2))
            : null,
        band: numericalBand,
      },
    };

    const scoringMetadata: Prisma.InputJsonObject = {
      scoringVersion: SCORING_VERSION,
      scoringRule: 'exact-json-answer-match',
      bandThresholds: {
        advanced: '80-100',
        proficient: '60-79.99',
        developing: '40-59.99',
        emerging: '0-39.99',
      },
      formId: session.assessmentFormId,
      formVersion: session.assessmentForm.version,
      scoredItemCount: overallMaxScore,
      responseCount: responses.length,
    };

    return this.prisma.score.upsert({
      where: {
        sessionId,
      },
      create: {
        sessionId,
        abstractRawScore,
        abstractMaxScore,
        numericalRawScore,
        numericalMaxScore,
        overallRawScore,
        overallMaxScore,
        overallComposite,
        abstractBand,
        numericalBand,
        overallBand,
        domainScores: domainScorePayload,
        scoringMetadata,
        scoringVersion: SCORING_VERSION,
      },
      update: {
        abstractRawScore,
        abstractMaxScore,
        numericalRawScore,
        numericalMaxScore,
        overallRawScore,
        overallMaxScore,
        overallComposite,
        abstractBand,
        numericalBand,
        overallBand,
        domainScores: domainScorePayload,
        scoringMetadata,
        scoringVersion: SCORING_VERSION,
      },
    });
  }

  async getSessionScore(sessionId: string, user: RequestUser) {
    const session = await this.getSessionOrThrow(sessionId);

    this.assertUserCanAccessSession(session, user);

    const score = await this.prisma.score.findUnique({
      where: {
        sessionId,
      },
    });

    if (!score) {
      throw new NotFoundException('Score not found for this session');
    }

    return score;
  }

  private async getSessionOrThrow(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        campaign: true,
        assessmentForm: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  private assertUserCanAccessSession(
    session: {
      userId: string;
      campaign?: { organisationId: string } | null;
    },
    user: RequestUser,
  ) {
    if (user.role === 'PLATFORM_ADMIN') {
      return;
    }

    if (
      (user.role === 'CANDIDATE' || user.role === 'CONSUMER') &&
      session.userId === user.id
    ) {
      return;
    }

    if (
      user.role === 'EMPLOYER_ADMIN' &&
      session.campaign?.organisationId === user.organisationId
    ) {
      return;
    }

    throw new ForbiddenException('You cannot access scoring for this session');
  }

  private answersMatch(answer: Prisma.JsonValue, correctAnswer: Prisma.JsonValue) {
    return this.stableStringify(answer) === this.stableStringify(correctAnswer);
  }

  private stableStringify(value: Prisma.JsonValue) {
    if (Array.isArray(value)) {
      return JSON.stringify(value.map((item) => this.normaliseJsonValue(item)));
    }

    return JSON.stringify(this.normaliseJsonValue(value));
  }

private normaliseJsonValue(value: Prisma.JsonValue): Prisma.JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => this.normaliseJsonValue(item));
  }

  if (value !== null && typeof value === 'object') {
    const jsonObject = value as Prisma.JsonObject;

    const sortedEntries = Object.entries(jsonObject)
      .filter((entry): entry is [string, Prisma.JsonValue] => {
        return entry[1] !== undefined;
      })
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, item]): [string, Prisma.JsonValue] => {
        return [key, this.normaliseJsonValue(item)];
      });

    return Object.fromEntries(sortedEntries) as Prisma.JsonObject;
  }

  return value;
}

  private mapBand(rawScore: number, maxScore: number) {
    if (maxScore === 0) {
      return 'UNSCORED';
    }

    const percentage = (rawScore / maxScore) * 100;

    if (percentage >= 80) {
      return 'ADVANCED';
    }

    if (percentage >= 60) {
      return 'PROFICIENT';
    }

    if (percentage >= 40) {
      return 'DEVELOPING';
    }

    return 'EMERGING';
  }
}