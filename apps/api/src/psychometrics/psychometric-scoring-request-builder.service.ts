import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  PSYCHOMETRIC_SCORING_CONTRACT_VERSION,
  type PsychometricAssessmentContext,
  type PsychometricItemResponse,
  type PsychometricPresentedItem,
  type PsychometricScoringRequest,
  type PsychometricSessionSource,
  type PsychometricTimingEvent,
  type PsychometricValidityInput,
} from './psychometric-scoring-contract.types';

type JsonRecord = Record<string, unknown>;

type LoadedSession = NonNullable<
  Awaited<ReturnType<PsychometricScoringRequestBuilderService['loadSession']>>
>;

const PROVISIONAL_DIFFICULTY_BY_LABEL: Record<string, number> = {
  VERY_EASY: -2,
  EASY: -1,
  MEDIUM: 0,
  MODERATE: 0,
  HARD: 1,
  DIFFICULT: 1,
  VERY_HARD: 2,
};

@Injectable()
export class PsychometricScoringRequestBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async buildForSession(
    sessionId: string,
  ): Promise<PsychometricScoringRequest> {
    const session = await this.loadSession(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    if (!session.completedAt) {
      throw new BadRequestException(
        'Only completed sessions can be submitted for psychometric scoring.',
      );
    }

    const mappings = session.assessmentForm.items
      .filter((mapping) => mapping.status === 'ACTIVE')
      .sort((left, right) => left.orderIndex - right.orderIndex);

    if (mappings.length === 0) {
      throw new BadRequestException(
        'The session assessment form does not contain active mapped items.',
      );
    }

    const responsesByItemId = new Map(
      session.responses.map((response) => [response.itemId, response]),
    );

    const presentedItems = mappings.map((mapping, index) =>
      this.toPresentedItem({
        mapping,
        sequenceIndex: index + 1,
      }),
    );

    const itemResponses = presentedItems.map((presentedItem) => {
      const response = responsesByItemId.get(presentedItem.itemId);

      return this.toItemResponse({
        presentedItem,
        response,
      });
    });

    const validityInput = this.toValidityInput({
      session,
      itemResponses,
    });

    return {
      contractVersion: PSYCHOMETRIC_SCORING_CONTRACT_VERSION,
      requestedScoringMode: 'IRT_3PL_PROVISIONAL',
      requestedAt: new Date().toISOString(),
      session: {
        sessionId: session.id,
        userId: session.userId,
        candidateId: session.userId,
        invitationId: session.invitationId,
        campaignId: session.campaignId,
        organisationId: session.campaign?.organisationId ?? null,
        assessmentFormId: session.assessmentFormId,
        source: this.resolveSessionSource(session),
        startedAt: session.startedAt?.toISOString() ?? null,
        completedAt: session.completedAt?.toISOString() ?? null,
        submittedAt: session.completedAt?.toISOString() ?? null,
        locale: null,
        timezone: null,
      },
      assessment: this.toAssessmentContext({
        session,
        presentedItemCount: presentedItems.length,
      }),
      items: presentedItems,
      responses: itemResponses,
      timingEvents: this.toTimingEvents(session),
      validityInput,
    };
  }

  async loadSession(sessionId: string) {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        campaign: {
          select: {
            id: true,
            organisationId: true,
          },
        },
        assessmentForm: {
          include: {
            sections: true,
            items: {
              include: {
                section: true,
                item: {
                  include: {
                    psychometricMetrics: {
                      orderBy: { createdAt: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          include: {
            item: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  private toAssessmentContext({
    session,
    presentedItemCount,
  }: {
    session: LoadedSession;
    presentedItemCount: number;
  }): PsychometricAssessmentContext {
    const domainCounts = new Map<string, number>();

    for (const mapping of session.assessmentForm.items) {
      if (mapping.status !== 'ACTIVE') {
        continue;
      }

      const domain = String(mapping.item.domain);
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    }

    const sectionDurationByDomain = new Map<string, number>();

    for (const section of session.assessmentForm.sections) {
      const domain = String(section.domain);
      sectionDurationByDomain.set(
        domain,
        (sectionDurationByDomain.get(domain) ?? 0) + section.timeLimitSec,
      );
    }

    return {
      assessmentFormId: session.assessmentForm.id,
      assessmentFormName: session.assessmentForm.name,
      assessmentVersion: String(session.assessmentForm.version),
      formBlueprintVersion: session.assessmentForm.versionLabel,
      totalPresentedItems: presentedItemCount,
      expectedDurationSeconds:
        session.assessmentForm.sections.reduce(
          (sum, section) => sum + section.timeLimitSec,
          0,
        ) || null,
      domains: [...domainCounts.entries()].map(([domain, count]) => ({
        domain,
        label: this.humaniseLabel(domain),
        expectedItemCount: count,
        expectedDurationSeconds: sectionDurationByDomain.get(domain) ?? null,
      })),
    };
  }

  private toPresentedItem({
    mapping,
    sequenceIndex,
  }: {
    mapping: LoadedSession['assessmentForm']['items'][number];
    sequenceIndex: number;
  }): PsychometricPresentedItem {
    const latestMetric = mapping.item.psychometricMetrics[0];
    const difficulty = this.resolveDifficulty({
      itemDifficulty: mapping.item.difficulty,
      intendedDifficulty: mapping.item.intendedDifficulty,
      proportionCorrect: latestMetric?.proportionCorrect ?? null,
    });

    return {
      itemId: mapping.item.id,
      itemVersion: String(mapping.item.version),
      sequenceIndex,
      sectionId: mapping.sectionId,
      domain: String(mapping.item.domain),
      subdomain: mapping.item.subdomain,
      itemType: mapping.item.itemType,
      maxScore: 1,
      correctOptionId: this.extractComparableAnswer(mapping.item.correctAnswer),
      presentedAt: null,
      calibration: {
        difficulty,
        discrimination: latestMetric?.discriminationValue ?? 1,
        guessing: this.resolveGuessing(mapping.item.options),
        slipping: null,
        timeIntensity: mapping.item.estimatedResponseTimeSec,
        calibrationSampleSize: latestMetric?.responseCount ?? null,
        calibrationVersion: latestMetric
          ? 'internal-item-metrics-v1'
          : 'provisional-defaults-v1',
      },
      metadata: {
        scoringRule: mapping.item.scoringRule,
        intendedDifficulty: mapping.item.intendedDifficulty,
        itemFamily: mapping.item.itemFamily,
        stimulusType: mapping.item.stimulusType,
        cognitiveProcess: mapping.item.cognitiveProcess,
      },
    };
  }

  private toItemResponse({
    presentedItem,
    response,
  }: {
    presentedItem: PsychometricPresentedItem;
    response: LoadedSession['responses'][number] | undefined;
  }): PsychometricItemResponse {
    if (!response) {
      return {
        itemId: presentedItem.itemId,
        selectedOptionId: null,
        responseText: null,
        status: 'OMITTED',
        correctness: 'UNSCORED',
        rawScore: 0,
        responseTimeMs: null,
        firstInteractionTimeMs: null,
        revisionCount: 0,
        confidenceRating: null,
        answeredAt: null,
      };
    }

    const selectedOptionId = this.extractComparableAnswer(response.answer);
    const isAnswered = selectedOptionId !== null;
    const isCorrect =
      isAnswered &&
      presentedItem.correctOptionId !== null &&
      selectedOptionId === presentedItem.correctOptionId;

    return {
      itemId: presentedItem.itemId,
      selectedOptionId,
      responseText: this.extractResponseText(response.answer),
      status: isAnswered ? 'ANSWERED' : 'OMITTED',
      correctness: isAnswered
        ? isCorrect
          ? 'CORRECT'
          : 'INCORRECT'
        : 'UNSCORED',
      rawScore: isCorrect ? 1 : 0,
      responseTimeMs: this.extractNumber(response.answer, [
        'responseTimeMs',
        'durationMs',
        'timeSpentMs',
        'elapsedMs',
      ]),
      firstInteractionTimeMs: this.extractNumber(response.answer, [
        'firstInteractionTimeMs',
        'firstInteractionMs',
      ]),
      revisionCount:
        this.extractNumber(response.answer, ['revisionCount', 'revisions']) ??
        0,
      confidenceRating: this.extractNumber(response.answer, [
        'confidenceRating',
        'confidence',
      ]),
      answeredAt: response.submittedAt?.toISOString() ?? null,
    };
  }

  private toTimingEvents(session: LoadedSession): PsychometricTimingEvent[] {
    const events: PsychometricTimingEvent[] = [];

    if (session.startedAt) {
      events.push({
        eventType: 'SESSION_STARTED',
        itemId: null,
        sectionId: null,
        occurredAt: session.startedAt.toISOString(),
        durationMs: null,
        metadata: {},
      });
    }

    if (session.completedAt) {
      events.push({
        eventType: 'SESSION_SUBMITTED',
        itemId: null,
        sectionId: null,
        occurredAt: session.completedAt.toISOString(),
        durationMs:
          session.startedAt && session.completedAt
            ? session.completedAt.getTime() - session.startedAt.getTime()
            : null,
        metadata: {},
      });
    }

    return events;
  }

  private toValidityInput({
    session,
    itemResponses,
  }: {
    session: LoadedSession;
    itemResponses: PsychometricItemResponse[];
  }): PsychometricValidityInput {
    const responseTimes = itemResponses
      .map((response) => response.responseTimeMs)
      .filter(
        (value): value is number => typeof value === 'number' && value >= 0,
      )
      .sort((left, right) => left - right);

    const omittedCount = itemResponses.filter(
      (response) =>
        response.status === 'OMITTED' ||
        response.status === 'SKIPPED' ||
        response.status === 'TIMED_OUT' ||
        response.status === 'NOT_PRESENTED',
    ).length;

    const rapidCount = itemResponses.filter(
      (response) =>
        typeof response.responseTimeMs === 'number' &&
        response.responseTimeMs < 3_000,
    ).length;

    const totalResponseTimeMs =
      session.startedAt && session.completedAt
        ? session.completedAt.getTime() - session.startedAt.getTime()
        : responseTimes.length > 0
          ? responseTimes.reduce((sum, value) => sum + value, 0)
          : null;

    return {
      omissionRate:
        itemResponses.length > 0 ? omittedCount / itemResponses.length : 0,
      rapidGuessingRate:
        itemResponses.length > 0 ? rapidCount / itemResponses.length : 0,
      medianResponseTimeMs: this.median(responseTimes),
      totalResponseTimeMs,
      suspiciousSessionFlags: [],
      browserOrDeviceSignals: {},
    };
  }

  private resolveSessionSource(
    session: LoadedSession,
  ): PsychometricSessionSource {
    if (session.campaignId) {
      return 'EMPLOYER_CAMPAIGN';
    }

    if (session.invitationId) {
      return 'INVITATION';
    }

    return 'CONSUMER_SELF_SERVICE';
  }

  private resolveDifficulty({
    itemDifficulty,
    intendedDifficulty,
    proportionCorrect,
  }: {
    itemDifficulty: string | null;
    intendedDifficulty: string | null;
    proportionCorrect: number | null;
  }): number {
    if (
      typeof proportionCorrect === 'number' &&
      proportionCorrect > 0.01 &&
      proportionCorrect < 0.99
    ) {
      return this.clamp(
        Math.log((1 - proportionCorrect) / proportionCorrect),
        -4,
        4,
      );
    }

    const label = String(intendedDifficulty ?? itemDifficulty ?? 'MEDIUM')
      .trim()
      .toUpperCase()
      .replaceAll(' ', '_');

    return PROVISIONAL_DIFFICULTY_BY_LABEL[label] ?? 0;
  }

  private resolveGuessing(options: Prisma.JsonValue): number {
    if (!Array.isArray(options) || options.length <= 1) {
      return 0;
    }

    return this.clamp(1 / options.length, 0, 0.35);
  }

  private extractComparableAnswer(value: Prisma.JsonValue): string | null {
    if (value === null) {
      return null;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }

    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }

    if (this.isRecord(value)) {
      const candidate =
        value.selectedOptionId ??
        value.optionId ??
        value.selectedOption ??
        value.answer ??
        value.value ??
        value.id;

      return this.extractComparableAnswer(candidate as Prisma.JsonValue);
    }

    return null;
  }

  private extractResponseText(value: Prisma.JsonValue): string | null {
    if (typeof value === 'string') {
      return value;
    }

    if (this.isRecord(value)) {
      const candidate = value.responseText ?? value.text ?? value.freeText;

      if (typeof candidate === 'string') {
        return candidate;
      }
    }

    return null;
  }

  private extractNumber(
    value: Prisma.JsonValue,
    keys: string[],
  ): number | null {
    if (!this.isRecord(value)) {
      return null;
    }

    for (const key of keys) {
      const candidate = value[key];

      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }

      if (typeof candidate === 'string' && candidate.trim() !== '') {
        const parsed = Number(candidate);

        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private median(values: number[]): number | null {
    if (values.length === 0) {
      return null;
    }

    const middleIndex = Math.floor(values.length / 2);
    const middleValue = values[middleIndex];

    if (typeof middleValue !== 'number') {
      return null;
    }

    if (values.length % 2 === 1) {
      return middleValue;
    }

    const previousValue = values[middleIndex - 1];

    if (typeof previousValue !== 'number') {
      return null;
    }

    return Math.round((previousValue + middleValue) / 2);
  }

  private humaniseLabel(value: string): string {
    return value
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private clamp(value: number, lower: number, upper: number): number {
    return Math.max(lower, Math.min(value, upper));
  }

  private isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
