import { Injectable } from '@nestjs/common';
import {
  CampaignStatus,
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
  InternalAdminOverview,
  InternalFormPerformanceSummary,
  InternalResearcherDashboardOverview,
  InternalSectionPerformanceSummary,
  ScoreDistributionBucket,
  InternalItemTraceabilityOutput,
  InternalReportScoreAuditOutput,
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

const reportAuditInclude = {
  session: {
    include: {
      user: true,
      assessmentForm: true,
      score: true,
    },
  },
} satisfies Prisma.ReportInclude;

type ReportWithInternalAuditRelations = Prisma.ReportGetPayload<{
  include: typeof reportAuditInclude;
}>;

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
  async getSectionPerformanceSummaries(): Promise<
    InternalSectionPerformanceSummary[]
  > {
    const [items, sessions] = await Promise.all([
      this.prisma.item.findMany({
        include: itemInclude,
      }),
      this.prisma.session.findMany({
        include: sessionInclude,
      }),
    ]);

    const domains = Array.from(new Set(items.map((item) => item.domain)));

    return Promise.all(
      domains.map(async (domain) => {
        const domainItems = items.filter((item) => item.domain === domain);
        const domainItemIds = new Set(domainItems.map((item) => item.id));
        const activeFormIds = new Set(
          domainItems.flatMap((item) =>
            item.formMappings
              .filter(
                (mapping) => mapping.status === FormItemMappingStatus.ACTIVE,
              )
              .map((mapping) => mapping.formId),
          ),
        );

        const relevantSessions = sessions.filter((session) =>
          activeFormIds.has(session.assessmentFormId),
        );

        const startedSessions = relevantSessions.filter(
          (session) => session.status !== SessionStatus.NOT_STARTED,
        );
        const completedSessions = relevantSessions.filter(
          (session) => session.status === SessionStatus.COMPLETED,
        );

        const sessionScores = this.calculateDomainSessionScores({
          domainItemIds,
          sessions: relevantSessions,
          items: domainItems,
        });

        const averageScorePercent =
          sessionScores.length === 0
            ? 0
            : Math.round(
                sessionScores.reduce((sum, score) => sum + score, 0) /
                  sessionScores.length,
              );

        const completionTimes = completedSessions
          .map((session) =>
            this.calculateCompletionTimeMinutes({
              startedAt: session.startedAt,
              completedAt: session.completedAt,
            }),
          )
          .filter((duration): duration is number => duration !== null);

        return {
          section: domain,
          sectionLabel: this.humaniseDomain(domain),
          startedSessions: startedSessions.length,
          completedSessions: completedSessions.length,
          completionRate:
            startedSessions.length === 0
              ? 0
              : completedSessions.length / startedSessions.length,
          averageScorePercent,
          averageCompletionTimeMinutes:
            completionTimes.length === 0
              ? null
              : Math.round(
                  completionTimes.reduce((sum, time) => sum + time, 0) /
                    completionTimes.length,
                ),
          scoreDistribution: this.toScoreDistribution(sessionScores),
        };
      }),
    );
  }

  async getInternalItemTraceability(
    itemId: string,
  ): Promise<InternalItemTraceabilityOutput | undefined> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: itemInclude,
    });

    if (!item) {
      return undefined;
    }

    const formIds = item.formMappings.map((mapping) => mapping.formId);

    const sessions =
      formIds.length === 0
        ? []
        : await this.prisma.session.findMany({
            where: {
              assessmentFormId: {
                in: formIds,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            include: sessionInclude,
          });

    const linkedSessions = sessions.map((session) => {
      const response = session.responses.find(
        (currentResponse) => currentResponse.itemId === item.id,
      );

      return {
        sessionId: session.id,
        participantIdentifier:
          session.user.name ?? session.user.email ?? session.user.id,
        formId: session.assessmentFormId,
        formLabel: session.assessmentForm.name,
        sessionStatus: session.status,
        startedAt: session.startedAt?.toISOString() ?? null,
        completedAt: session.completedAt?.toISOString() ?? null,
        answeredItem:
          response?.answer !== null &&
          response?.answer !== undefined &&
          Boolean(response),
        answer: response?.answer ?? null,
        submittedAt: response?.submittedAt?.toISOString() ?? null,
        overallBand: session.score?.overallBand ?? null,
      };
    });

    const forms = item.formMappings.map((mapping) => {
      const formSessions = sessions.filter(
        (session) => session.assessmentFormId === mapping.formId,
      );

      const formResponses = formSessions
        .map((session) =>
          session.responses.find((response) => response.itemId === item.id),
        )
        .filter((response) => response !== undefined);

      const validResponses = formResponses.filter(
        (response) => response.answer !== null && response.answer !== undefined,
      );

      const correctResponses = validResponses.filter((response) =>
        this.areJsonValuesEqual(response.answer, item.correctAnswer),
      );

      return {
        mappingId: mapping.id,
        formId: mapping.formId,
        formLabel:
          formSessions[0]?.assessmentForm.name ?? `Form ${mapping.formId}`,
        sectionId: mapping.sectionId,
        mappingStatus: mapping.status,
        orderIndex: mapping.orderIndex,
        exposureCount: formSessions.length,
        validResponses: validResponses.length,
        correctResponses: correctResponses.length,
        omissionCount: Math.max(formSessions.length - validResponses.length, 0),
        completedSessions: formSessions.filter(
          (session) => session.status === SessionStatus.COMPLETED,
        ).length,
        inProgressSessions: formSessions.filter(
          (session) => session.status === SessionStatus.IN_PROGRESS,
        ).length,
      };
    });

    const totalValidResponses = linkedSessions.filter(
      (session) => session.answeredItem,
    ).length;

    const totalCorrectResponses = linkedSessions.filter((session) =>
      this.areJsonValuesEqual(session.answer, item.correctAnswer),
    ).length;

    return {
      itemId: item.id,
      itemLabel: `${item.domain} ${item.itemType}`,
      domain: item.domain,
      status: item.status,
      totalExposureCount: linkedSessions.length,
      totalValidResponses,
      totalCorrectResponses,
      totalOmissions: Math.max(linkedSessions.length - totalValidResponses, 0),
      forms,
      linkedSessions,
    };
  }

  async getReportScoreAuditRecords(): Promise<
    InternalReportScoreAuditOutput[]
  > {
    const reports = await this.prisma.report.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
      include: reportAuditInclude,
    });

    return reports.map((report) => this.toReportScoreAuditOutput(report));
  }

  async getFormPerformanceSummaries(): Promise<
    InternalFormPerformanceSummary[]
  > {
    const sessions = await this.prisma.session.findMany({
      include: sessionInclude,
    });

    const groupedByForm = new Map<string, SessionWithInternalRelations[]>();

    sessions.forEach((session) => {
      const current = groupedByForm.get(session.assessmentFormId) ?? [];
      current.push(session);
      groupedByForm.set(session.assessmentFormId, current);
    });

    return Array.from(groupedByForm.entries()).map(([formId, formSessions]) => {
      const startedSessions = formSessions.filter(
        (session) => session.status !== SessionStatus.NOT_STARTED,
      );
      const completedSessions = formSessions.filter(
        (session) => session.status === SessionStatus.COMPLETED,
      );

      const completionTimes = completedSessions
        .map((session) =>
          this.calculateCompletionTimeMinutes({
            startedAt: session.startedAt,
            completedAt: session.completedAt,
          }),
        )
        .filter((duration): duration is number => duration !== null);

      return {
        formId,
        formLabel: formSessions[0]?.assessmentForm.name ?? formId,
        startedSessions: startedSessions.length,
        completedSessions: completedSessions.length,
        completionRate:
          startedSessions.length === 0
            ? 0
            : completedSessions.length / startedSessions.length,
        averageCompletionTimeMinutes:
          completionTimes.length === 0
            ? null
            : Math.round(
                completionTimes.reduce((sum, time) => sum + time, 0) /
                  completionTimes.length,
              ),
        scoreSpread: this.toBandDistribution(
          completedSessions.map(
            (session) => session.score?.overallBand ?? 'Not scored',
          ),
        ),
      };
    });
  }

  async getResearcherDashboardOverview(): Promise<InternalResearcherDashboardOverview> {
    const [items, sessions, sectionPerformance, formPerformance] =
      await Promise.all([
        this.getInternalItems(),
        this.getSessionReviewRecords(),
        this.getSectionPerformanceSummaries(),
        this.getFormPerformanceSummaries(),
      ]);

    const totalItemsByStatus = items.reduce<Record<string, number>>(
      (summary, item) => ({
        ...summary,
        [item.status]: (summary[item.status] ?? 0) + 1,
      }),
      {},
    );

    const activeItemsByDomain = Object.entries(
      items
        .filter((item) => item.active)
        .reduce<Record<string, number>>(
          (summary, item) => ({
            ...summary,
            [item.domain]: (summary[item.domain] ?? 0) + 1,
          }),
          {},
        ),
    ).map(([domain, count]) => ({
      domain,
      label: this.humaniseDomain(domain),
      count,
    }));

    const sectionTimes = sectionPerformance
      .map((section) => section.averageCompletionTimeMinutes)
      .filter((duration): duration is number => duration !== null);

    const itemsNeedingReview = items
      .filter(
        (item) =>
          item.status === ItemStatus.UNDER_REVIEW ||
          (item.performance.validResponses >= 5 &&
            item.performance.correctResponseRate <= 0.25) ||
          (item.performance.validResponses >= 5 &&
            item.performance.correctResponseRate >= 0.9) ||
          item.performance.omissionCount >= 10,
      )
      .map((item) => ({
        id: item.id,
        label: item.label,
        domain: item.domain,
        status: item.status,
        reason: this.getItemReviewReason(item),
      }));

    return {
      totalItemsByStatus,
      activeItemsByDomain,
      formsInUse: formPerformance.length,
      recentSessionVolume: sessions.length,
      flaggedSessionCount: sessions.filter(
        (session) => session.suspiciousFlagStatus !== 'NONE',
      ).length,
      averageSectionCompletionTime:
        sectionTimes.length === 0
          ? null
          : Math.round(
              sectionTimes.reduce((sum, duration) => sum + duration, 0) /
                sectionTimes.length,
            ),
      itemsNeedingReview,
    };
  }

  async getAdminOverview(): Promise<InternalAdminOverview> {
    const [
      organisationCount,
      activeCampaigns,
      userCountsByRole,
      recentAuditActivity,
    ] = await Promise.all([
      this.prisma.organisation.count(),
      this.prisma.campaign.count({
        where: {
          status: CampaignStatus.ACTIVE,
        },
      }),
      this.getUserCountsByRole(),
      this.getInternalAuditEvents(),
    ]);

    return {
      organisationCount,
      activeCampaigns,
      userCountsByRole,
      recentAuditActivity: recentAuditActivity.slice(0, 10),
      platformErrors: recentAuditActivity.filter(
        (event) =>
          event.action.includes('ERROR') ||
          event.action.includes('FAILED') ||
          event.action.includes('FAILURE'),
      ),
      exportEvents: recentAuditActivity.filter((event) =>
        event.action.includes('EXPORT'),
      ),
      itemLifecycleEvents: recentAuditActivity.filter(
        (event) =>
          event.action.includes('ITEM_ACTIVATED') ||
          event.action.includes('ITEM_RETIRED'),
      ),
    };
  }
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
  private toReportScoreAuditOutput(
    report: ReportWithInternalAuditRelations,
  ): InternalReportScoreAuditOutput {
    const metadata = this.toPlainRecord(report.metadata);
    const score = report.session.score;

    return {
      reportId: report.id,
      sessionId: report.sessionId,
      participantIdentifier:
        report.session.user.name ??
        report.session.user.email ??
        report.session.user.id,
      formId: report.session.assessmentFormId,
      formLabel: report.session.assessmentForm.name,
      formVersion:
        typeof metadata.formVersion === 'string' ||
        typeof metadata.formVersion === 'number'
          ? String(metadata.formVersion)
          : null,
      scoringVersion: score?.scoringVersion ?? null,
      reportVersion: report.reportVersion,
      reportGenerationTimestamp: report.createdAt.toISOString(),
      reportType:
        typeof metadata.reportType === 'string'
          ? metadata.reportType
          : String(report.visibility),
      visibilityCategory: String(report.visibility),
      scoreId: report.scoreId,
      scoreCreatedAt: score?.createdAt.toISOString() ?? null,
      scoreUpdatedAt: score?.updatedAt.toISOString() ?? null,
      overallBand: score?.overallBand ?? null,
      overallRawScore: score?.overallRawScore ?? null,
      overallMaxScore: score?.overallMaxScore ?? null,
      abstractBand: score?.abstractBand ?? null,
      numericalBand: score?.numericalBand ?? null,
    };
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
  private calculateDomainSessionScores({
    domainItemIds,
    sessions,
    items,
  }: {
    domainItemIds: Set<string>;
    sessions: SessionWithInternalRelations[];
    items: ItemWithInternalRelations[];
  }) {
    const itemById = new Map(items.map((item) => [item.id, item]));

    return sessions
      .map((session) => {
        const relevantResponses = session.responses.filter((response) =>
          domainItemIds.has(response.itemId),
        );

        if (relevantResponses.length === 0) {
          return null;
        }

        const correctResponses = relevantResponses.filter((response) => {
          const item = itemById.get(response.itemId);

          if (!item) {
            return false;
          }

          return this.areJsonValuesEqual(response.answer, item.correctAnswer);
        });

        return Math.round(
          (correctResponses.length / relevantResponses.length) * 100,
        );
      })
      .filter((score): score is number => score !== null);
  }

  private toScoreDistribution(scores: number[]): ScoreDistributionBucket[] {
    return [
      {
        label: '0–25%',
        count: scores.filter((score) => score >= 0 && score <= 25).length,
      },
      {
        label: '26–50%',
        count: scores.filter((score) => score >= 26 && score <= 50).length,
      },
      {
        label: '51–75%',
        count: scores.filter((score) => score >= 51 && score <= 75).length,
      },
      {
        label: '76–100%',
        count: scores.filter((score) => score >= 76 && score <= 100).length,
      },
    ];
  }

  private toBandDistribution(bands: string[]): ScoreDistributionBucket[] {
    const counts = bands.reduce<Record<string, number>>(
      (summary, band) => ({
        ...summary,
        [band]: (summary[band] ?? 0) + 1,
      }),
      {},
    );

    return Object.entries(counts).map(([label, count]) => ({
      label,
      count,
    }));
  }

  private async getUserCountsByRole() {
    const groupedUsers = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        _all: true,
      },
    });

    return groupedUsers.reduce<Record<string, number>>(
      (summary, groupedUser) => ({
        ...summary,
        [groupedUser.role]: groupedUser._count._all,
      }),
      {},
    );
  }

  private humaniseDomain(domain: string) {
    return domain
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getItemReviewReason(item: InternalItemOutput) {
    if (item.status === ItemStatus.UNDER_REVIEW) {
      return 'Item is already marked under review.';
    }

    if (
      item.performance.validResponses >= 5 &&
      item.performance.correctResponseRate <= 0.25
    ) {
      return 'Correct-response rate is very low for observed responses.';
    }

    if (
      item.performance.validResponses >= 5 &&
      item.performance.correctResponseRate >= 0.9
    ) {
      return 'Correct-response rate is very high for observed responses.';
    }

    if (item.performance.omissionCount >= 10) {
      return 'Omission count is high relative to current exposure.';
    }

    return 'Review recommended.';
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
