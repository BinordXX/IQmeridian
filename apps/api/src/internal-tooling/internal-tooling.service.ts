import { Injectable } from '@nestjs/common';
import {
  FormItemMappingStatus,
  ItemStatus,
  Prisma,
  SessionStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsExportDefinition,
  CreateInternalAuditEventInput,
  CreateInternalReviewStatusInput,
  InternalAuditEvent,
  InternalCompletionStatus,
  InternalItemDetailOutput,
  InternalItemOutput,
  InternalItemPerformanceOutput,
  InternalReviewStatusRecord,
  InternalSessionOutput,
  SuspiciousFlagEvaluation,
  SuspiciousFlagStatus,
  SuspiciousSessionIndicator,
} from './internal-tooling.types';

const sessionInclude = {
  user: true,
  campaign: true,
  invitation: true,
  assessmentForm: true,
  responses: true,
  score: true,
} satisfies Prisma.SessionInclude;

const auditLogInclude = {
  user: true,
} satisfies Prisma.AuditLogInclude;

const itemInclude = {
  formMappings: true,
  responses: {
    include: {
      session: true,
    },
  },
} satisfies Prisma.ItemInclude;

type SessionWithInternalRelations = Prisma.SessionGetPayload<{
  include: typeof sessionInclude;
}>;

type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: typeof auditLogInclude;
}>;

type ItemWithInternalRelations = Prisma.ItemGetPayload<{
  include: typeof itemInclude;
}>;

const analyticsExportDefinitions: AnalyticsExportDefinition[] = [
  {
    dataset: 'ITEM_LEVEL',
    label: 'Item-level data',
    description:
      'Item metadata, status, domain, active state, review flags, and item-performance indicators.',
    format: 'CSV',
    currentlyAvailable: true,
  },
  {
    dataset: 'SESSION_LEVEL',
    label: 'Session-level data',
    description:
      'Session status, participant identifier, form used, timestamps, completion state, and suspicious markers.',
    format: 'CSV',
    currentlyAvailable: true,
  },
  {
    dataset: 'RESPONSE_LEVEL',
    label: 'Response-level data',
    description:
      'Candidate responses, item identifiers, response timing, omission state, and answer correctness.',
    format: 'CSV',
    currentlyAvailable: true,
  },
  {
    dataset: 'SCORE_LEVEL',
    label: 'Score-level data',
    description:
      'Section scores, overall score bands, score spread, and scoring timestamps.',
    format: 'CSV',
    currentlyAvailable: true,
  },
  {
    dataset: 'CAMPAIGN_SUMMARY',
    label: 'Campaign-level summaries',
    description:
      'Campaign-level completion, invitation usage, form distribution, and aggregate score outcomes.',
    format: 'JSON',
    currentlyAvailable: true,
  },
];

@Injectable()
export class InternalToolingService {
  constructor(private readonly prisma: PrismaService) {}

  async getInternalItems(): Promise<InternalItemOutput[]> {
    const items = await this.prisma.item.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: itemInclude,
    });

    return Promise.all(items.map((item) => this.toInternalItemOutput(item)));
  }

  async getInternalItemById(
    itemId: string,
  ): Promise<InternalItemDetailOutput | undefined> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: itemInclude,
    });

    if (!item) {
      return undefined;
    }

    const baseItem = await this.toInternalItemOutput(item);

    const [statusHistory, reviewNotes] = await Promise.all([
      this.getItemStatusHistory(item.id),
      this.getItemReviewNotes(item.id),
    ]);

    return {
      ...baseItem,
      statusHistory,
      formAssociations: item.formMappings.map((mapping) => ({
        id: mapping.id,
        formId: mapping.formId,
        sectionId: mapping.sectionId,
        status: mapping.status,
        orderIndex: mapping.orderIndex,
      })),
      reviewNotes,
    };
  }

  async getInternalItemPerformance(
    itemId: string,
  ): Promise<InternalItemPerformanceOutput | undefined> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: itemInclude,
    });

    if (!item) {
      return undefined;
    }

    return this.toInternalItemPerformance(item);
  }

  async getSessionReviewRecords(): Promise<InternalSessionOutput[]> {
    const sessions = await this.prisma.session.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
      include: sessionInclude,
    });

    return Promise.all(
      sessions.map((session) => this.toInternalSessionOutput(session)),
    );
  }

  async getSuspiciousSessionRecords(): Promise<InternalSessionOutput[]> {
    const sessions = await this.getSessionReviewRecords();

    return sessions.filter(
      (session) => session.suspiciousFlagStatus !== 'NONE',
    );
  }

  async getSessionById(
    sessionId: string,
  ): Promise<InternalSessionOutput | undefined> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });

    if (!session) {
      return undefined;
    }

    return this.toInternalSessionOutput(session);
  }

  getAnalyticsExportDefinitions(): AnalyticsExportDefinition[] {
    return analyticsExportDefinitions;
  }

  async getInternalAuditEvents(): Promise<InternalAuditEvent[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
      include: auditLogInclude,
    });

    return auditLogs.map((auditLog) => this.toInternalAuditEvent(auditLog));
  }

  async recordInternalAuditEvent(
    input: CreateInternalAuditEventInput,
  ): Promise<InternalAuditEvent> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata:
          input.metadata === undefined
            ? undefined
            : this.toJsonValue(input.metadata),
      },
      include: auditLogInclude,
    });

    return this.toInternalAuditEvent(auditLog);
  }

  async getInternalReviewStatusRecords(): Promise<
    InternalReviewStatusRecord[]
  > {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        action: 'REVIEW_STATUS_CHANGED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
      include: auditLogInclude,
    });

    return auditLogs.map((auditLog) =>
      this.toInternalReviewStatusRecord(auditLog),
    );
  }

  async recordInternalReviewStatus(
    input: CreateInternalReviewStatusInput,
  ): Promise<InternalReviewStatusRecord> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        action: 'REVIEW_STATUS_CHANGED',
        entityType: input.targetType,
        entityId: input.targetId,
        metadata: this.toJsonValue({
          targetType: input.targetType,
          targetId: input.targetId,
          status: input.status,
          reviewer: input.reviewer,
          notes: input.notes,
        }),
      },
      include: auditLogInclude,
    });

    return this.toInternalReviewStatusRecord(auditLog);
  }

  private async toInternalSessionOutput(
    session: SessionWithInternalRelations,
  ): Promise<InternalSessionOutput> {
    const expectedItemCount = await this.prisma.formItemMapping.count({
      where: {
        formId: session.assessmentFormId,
        status: FormItemMappingStatus.ACTIVE,
      },
    });

    const answeredResponses = session.responses.filter(
      (response) => response.answer !== null && response.answer !== undefined,
    );

    const omissionCount = Math.max(
      expectedItemCount - answeredResponses.length,
      0,
    );

    const omissionRate =
      expectedItemCount === 0 ? 0 : omissionCount / expectedItemCount;

    const completionTimeMinutes = this.calculateCompletionTimeMinutes({
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    });

    const refreshReconnectEvents = await this.countSessionAuditEvents({
      sessionId: session.id,
      actionTerms: ['RECONNECT', 'REFRESH', 'RESUME', 'ROUTE_ESCAPE', 'ESCAPE'],
    });

    const duplicateAccessAttempts = await this.countSessionAuditEvents({
      sessionId: session.id,
      actionTerms: ['DUPLICATE', 'REPEATED_ACCESS'],
    });

    const inconsistentSubmissionEvents = await this.countSessionAuditEvents({
      sessionId: session.id,
      actionTerms: ['INCONSISTENT_SUBMISSION', 'SUBMISSION_ANOMALY'],
    });

    const compressedTimingEvents = this.countCompressedTimingEvents(session);
    const interruptionHistory = await this.getInterruptionHistory(session.id);
    const reviewerNotes = await this.getReviewerNotes(session.id);

    const evaluation = this.evaluateSuspiciousFlags({
      status: session.status,
      completionTimeMinutes,
      refreshReconnectEvents,
      omissionRate,
      duplicateAccessAttempts,
      inconsistentSubmissionEvents,
      compressedTimingEvents,
      expectedItemCount,
    });

    return {
      sessionId: session.id,
      participantIdentifier:
        session.user.name ?? session.user.email ?? session.user.id,
      sessionType: session.campaignId ? 'EMPLOYER_LINKED' : 'CONSUMER',
      formId: session.assessmentFormId,
      formLabel: session.assessmentForm.name,
      status: session.status,
      startedAt: session.startedAt?.toISOString() ?? null,
      endedAt: session.completedAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      completionStatus: this.toCompletionStatus(session.status),
      overallBand: session.score?.overallBand ?? null,
      completionTimeMinutes,
      refreshReconnectEvents,
      omissionRate,
      duplicateAccessAttempts,
      inconsistentSubmissionEvents,
      compressedTimingEvents,
      interruptionHistory,
      responsePatternSummary: this.buildResponsePatternSummary({
        compressedTimingEvents,
        omissionRate,
        answeredCount: answeredResponses.length,
        expectedItemCount,
      }),
      scoringOutcome: this.buildScoringOutcome(session),
      reviewerNotes,
      suspiciousFlagStatus: evaluation.status,
      suspiciousIndicators: evaluation.indicators,
      suspiciousFlagReasons: evaluation.reasons,
    };
  }

  private evaluateSuspiciousFlags(input: {
    status: SessionStatus;
    completionTimeMinutes: number | null;
    refreshReconnectEvents: number;
    omissionRate: number;
    expectedItemCount: number;
    duplicateAccessAttempts: number;
    inconsistentSubmissionEvents: number;
    compressedTimingEvents: number;
  }): SuspiciousFlagEvaluation {
    const indicators: SuspiciousSessionIndicator[] = [];
    const reasons: string[] = [];

    if (
      input.status === SessionStatus.COMPLETED &&
      input.expectedItemCount >= 10 &&
      input.completionTimeMinutes !== null &&
      input.completionTimeMinutes < 20
    ) {
      indicators.push('UNUSUALLY_SHORT_COMPLETION_TIME');
      reasons.push(
        'Completed session below the minimum expected time threshold for a full assessment form.',
      );
    }

    if (input.refreshReconnectEvents >= 4) {
      indicators.push('REPEATED_REFRESH_RECONNECT');
      reasons.push('Repeated refresh or reconnect events were recorded.');
    }

    if (input.compressedTimingEvents >= 2) {
      indicators.push('ABNORMAL_RESPONSE_TIMING');
      reasons.push('Compressed response timing pattern was detected.');
    }

    if (input.duplicateAccessAttempts >= 2) {
      indicators.push('DUPLICATE_ACCESS_ANOMALY');
      reasons.push('Duplicate or repeated access behaviour was recorded.');
    }

    if (input.inconsistentSubmissionEvents >= 1) {
      indicators.push('INCONSISTENT_SUBMISSION_PATTERN');
      reasons.push('Submission behaviour was inconsistent with normal flow.');
    }

    if (
      input.status === SessionStatus.COMPLETED &&
      input.expectedItemCount >= 5 &&
      input.omissionRate >= 0.3
    ) {
      indicators.push('EXTREME_OMISSION_BEHAVIOUR');
      reasons.push(
        'Completed session omission rate exceeded the internal review threshold.',
      );
    }

    return {
      status: this.resolveSuspiciousFlagStatus(indicators.length),
      indicators,
      reasons,
    };
  }

  private resolveSuspiciousFlagStatus(
    indicatorCount: number,
  ): SuspiciousFlagStatus {
    if (indicatorCount >= 3) {
      return 'HIGH';
    }

    if (indicatorCount >= 2) {
      return 'MEDIUM';
    }

    if (indicatorCount === 1) {
      return 'LOW';
    }

    return 'NONE';
  }

  private toCompletionStatus(status: SessionStatus): InternalCompletionStatus {
    if (status === SessionStatus.COMPLETED) {
      return 'COMPLETE';
    }

    if (status === SessionStatus.NOT_STARTED) {
      return 'NOT_STARTED';
    }

    return 'PARTIAL';
  }

  private calculateCompletionTimeMinutes({
    startedAt,
    completedAt,
  }: {
    startedAt: Date | null;
    completedAt: Date | null;
  }) {
    if (!startedAt || !completedAt) {
      return null;
    }

    return Math.max(
      Math.round((completedAt.getTime() - startedAt.getTime()) / 60000),
      0,
    );
  }

  private countCompressedTimingEvents(session: SessionWithInternalRelations) {
    const submittedResponses = session.responses
      .filter((response) => response.submittedAt)
      .sort((first, second) => {
        const firstTime = first.submittedAt?.getTime() ?? 0;
        const secondTime = second.submittedAt?.getTime() ?? 0;

        return firstTime - secondTime;
      });

    let compressedTimingEvents = 0;

    for (let index = 1; index < submittedResponses.length; index += 1) {
      const previous = submittedResponses[index - 1]?.submittedAt;
      const current = submittedResponses[index]?.submittedAt;

      if (!previous || !current) {
        continue;
      }

      const secondsBetweenResponses =
        (current.getTime() - previous.getTime()) / 1000;

      if (secondsBetweenResponses >= 0 && secondsBetweenResponses <= 5) {
        compressedTimingEvents += 1;
      }
    }

    return compressedTimingEvents;
  }

  private async countSessionAuditEvents({
    sessionId,
    actionTerms,
  }: {
    sessionId: string;
    actionTerms: string[];
  }) {
    return this.prisma.auditLog.count({
      where: {
        entityType: 'Session',
        entityId: sessionId,
        OR: actionTerms.map((term) => ({
          action: {
            contains: term,
          },
        })),
      },
    });
  }

  private async getInterruptionHistory(sessionId: string) {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'Session',
        entityId: sessionId,
        OR: [
          { action: { contains: 'RECONNECT' } },
          { action: { contains: 'REFRESH' } },
          { action: { contains: 'RESUME' } },
          { action: { contains: 'ROUTE_ESCAPE' } },
          { action: { contains: 'ESCAPE' } },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 20,
    });

    if (auditLogs.length === 0) {
      return ['No interruption event was recorded in the audit log.'];
    }

    return auditLogs.map(
      (auditLog) => `${auditLog.action} at ${auditLog.createdAt.toISOString()}`,
    );
  }

  private async getReviewerNotes(sessionId: string) {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'SESSION',
        entityId: sessionId,
        action: 'REVIEW_STATUS_CHANGED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    if (auditLogs.length === 0) {
      return ['No reviewer note has been recorded for this session.'];
    }

    return auditLogs.map((auditLog) => {
      const metadata = this.toPlainRecord(auditLog.metadata);
      const notes = metadata.notes;

      return typeof notes === 'string' && notes.trim().length > 0
        ? notes
        : `Review status updated at ${auditLog.createdAt.toISOString()}`;
    });
  }

  private buildResponsePatternSummary({
    compressedTimingEvents,
    omissionRate,
    answeredCount,
    expectedItemCount,
  }: {
    compressedTimingEvents: number;
    omissionRate: number;
    answeredCount: number;
    expectedItemCount: number;
  }) {
    if (expectedItemCount === 0) {
      return 'No active form-item mappings were found for this session form.';
    }

    if (compressedTimingEvents >= 2 && omissionRate >= 0.3) {
      return 'Compressed response timing and high omission behaviour were both detected.';
    }

    if (compressedTimingEvents >= 2) {
      return 'Several responses were submitted within compressed timing windows.';
    }

    if (omissionRate >= 0.3) {
      return 'Omissions are high relative to the active item count for the form.';
    }

    return `${answeredCount} of ${expectedItemCount} expected items have recorded answers, with no major timing pattern detected.`;
  }

  private buildScoringOutcome(session: SessionWithInternalRelations) {
    if (!session.score) {
      return 'No score record has been generated for this session.';
    }

    const rawScore =
      session.score.overallRawScore === null ||
      session.score.overallMaxScore === null
        ? 'raw score unavailable'
        : `${session.score.overallRawScore}/${session.score.overallMaxScore}`;

    return `Overall band: ${session.score.overallBand ?? 'not assigned'}; overall score: ${rawScore}.`;
  }

  private async toInternalItemOutput(
    item: ItemWithInternalRelations,
  ): Promise<InternalItemOutput> {
    const performance = await this.toInternalItemPerformance(item);

    return {
      id: item.id,
      label: `${item.domain} ${item.itemType}`,
      domain: item.domain,
      itemType: item.itemType,
      prompt: item.prompt,
      options: item.options,
      correctAnswer: item.correctAnswer,
      difficulty: item.difficulty,
      status: item.status,
      version: item.version,
      active: item.status === ItemStatus.ACTIVE,
      historicallyActive: await this.hasItemEverBeenActive(
        item.id,
        item.status,
      ),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      formAssociationCount: item.formMappings.length,
      activeFormAssociationCount: item.formMappings.filter(
        (mapping) => mapping.status === FormItemMappingStatus.ACTIVE,
      ).length,
      performance,
    };
  }

  private async toInternalItemPerformance(
    item: ItemWithInternalRelations,
  ): Promise<InternalItemPerformanceOutput> {
    const activeFormIds = item.formMappings
      .filter((mapping) => mapping.status === FormItemMappingStatus.ACTIVE)
      .map((mapping) => mapping.formId);

    const exposureCount =
      activeFormIds.length === 0
        ? 0
        : await this.prisma.session.count({
            where: {
              assessmentFormId: {
                in: activeFormIds,
              },
              status: {
                in: [SessionStatus.IN_PROGRESS, SessionStatus.COMPLETED],
              },
            },
          });

    const validResponses = item.responses.filter(
      (response) => response.answer !== null && response.answer !== undefined,
    );

    const correctResponses = validResponses.filter((response) =>
      this.areJsonValuesEqual(response.answer, item.correctAnswer),
    );

    const omissionCount = Math.max(exposureCount - validResponses.length, 0);

    return {
      itemId: item.id,
      exposureCount,
      validResponses: validResponses.length,
      correctResponseRate:
        validResponses.length === 0
          ? 0
          : correctResponses.length / validResponses.length,
      omissionCount,
      averageResponseTimeSeconds:
        validResponses.length === 0
          ? null
          : this.calculateAverageItemResponseTimeSeconds(item),
      activeFormAssociations: activeFormIds.length,
    };
  }

  private async hasItemEverBeenActive(
    itemId: string,
    currentStatus: ItemStatus,
  ) {
    if (
      currentStatus === ItemStatus.ACTIVE ||
      currentStatus === ItemStatus.RETIRED
    ) {
      return true;
    }

    const activationAuditLog = await this.prisma.auditLog.findFirst({
      where: {
        entityType: 'Item',
        entityId: itemId,
        action: {
          contains: 'ITEM_ACTIVATED',
        },
      },
    });

    return Boolean(activationAuditLog);
  }

  private async getItemStatusHistory(itemId: string) {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: {
          in: ['Item', 'ITEM'],
        },
        entityId: itemId,
        OR: [
          { action: { contains: 'ITEM_CREATED' } },
          { action: { contains: 'ITEM_DRAFT_UPDATED' } },
          { action: { contains: 'ITEM_ACTIVATED' } },
          { action: { contains: 'ITEM_RETIRED' } },
          { action: { contains: 'REVIEW_STATUS_CHANGED' } },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 50,
      include: auditLogInclude,
    });

    return auditLogs.map((auditLog) => ({
      id: auditLog.id,
      action: auditLog.action,
      actor: auditLog.user?.name ?? auditLog.user?.email ?? 'System',
      summary: this.buildAuditSummary(auditLog),
      occurredAt: auditLog.createdAt.toISOString(),
    }));
  }

  private async getItemReviewNotes(itemId: string) {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: {
          in: ['Item', 'ITEM'],
        },
        entityId: itemId,
        action: 'REVIEW_STATUS_CHANGED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    if (auditLogs.length === 0) {
      return ['No internal review note has been recorded for this item.'];
    }

    return auditLogs.map((auditLog) => {
      const metadata = this.toPlainRecord(auditLog.metadata);
      const notes = metadata.notes;

      return typeof notes === 'string' && notes.trim().length > 0
        ? notes
        : `Review status updated at ${auditLog.createdAt.toISOString()}`;
    });
  }

  private calculateAverageItemResponseTimeSeconds(
    item: ItemWithInternalRelations,
  ) {
    const durations = item.responses
      .map((response) => {
        if (!response.submittedAt || !response.session.startedAt) {
          return null;
        }

        return Math.max(
          Math.round(
            (response.submittedAt.getTime() -
              response.session.startedAt.getTime()) /
              1000,
          ),
          0,
        );
      })
      .filter((duration): duration is number => duration !== null);

    if (durations.length === 0) {
      return null;
    }

    const total = durations.reduce((sum, duration) => sum + duration, 0);

    return Math.round(total / durations.length);
  }

  private areJsonValuesEqual(first: unknown, second: unknown) {
    return this.stableStringify(first) === this.stableStringify(second);
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }

    if (value && typeof value === 'object') {
      return `{${Object.entries(value)
        .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
        .map(
          ([key, nestedValue]) =>
            `${JSON.stringify(key)}:${this.stableStringify(nestedValue)}`,
        )
        .join(',')}}`;
    }

    return JSON.stringify(value);
  }

  private buildAuditSummary(auditLog: AuditLogWithUser) {
    const metadata = this.toPlainRecord(auditLog.metadata);

    if (typeof metadata.status === 'string') {
      return `${auditLog.action} · status ${metadata.status}`;
    }

    if (typeof metadata.domain === 'string') {
      return `${auditLog.action} · domain ${metadata.domain}`;
    }

    return auditLog.action;
  }

  private toInternalAuditEvent(auditLog: AuditLogWithUser): InternalAuditEvent {
    return {
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      actor: auditLog.user?.name ?? auditLog.user?.email ?? 'System',
      actorUserId: auditLog.userId,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt.toISOString(),
    };
  }

  private toInternalReviewStatusRecord(
    auditLog: AuditLogWithUser,
  ): InternalReviewStatusRecord {
    const metadata = this.toPlainRecord(auditLog.metadata);

    return {
      id: auditLog.id,
      targetType:
        metadata.targetType === 'ITEM' || metadata.targetType === 'SESSION'
          ? metadata.targetType
          : 'SESSION',
      targetId:
        typeof metadata.targetId === 'string'
          ? metadata.targetId
          : (auditLog.entityId ?? auditLog.id),
      status:
        metadata.status === 'UNDER_REVIEW' ||
        metadata.status === 'NEEDS_REVISION' ||
        metadata.status === 'APPROVED' ||
        metadata.status === 'SUSPICIOUS_REVIEWED' ||
        metadata.status === 'FALSE_POSITIVE' ||
        metadata.status === 'RETIRE_RECOMMENDED'
          ? metadata.status
          : 'UNDER_REVIEW',
      reviewer:
        typeof metadata.reviewer === 'string'
          ? metadata.reviewer
          : (auditLog.user?.name ??
            auditLog.user?.email ??
            'Internal reviewer'),
      notes: typeof metadata.notes === 'string' ? metadata.notes : '',
      updatedAt: auditLog.createdAt.toISOString(),
    };
  }

  private toPlainRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
