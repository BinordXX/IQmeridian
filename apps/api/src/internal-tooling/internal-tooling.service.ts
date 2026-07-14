import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import {
  CampaignStatus,
  FormItemMappingStatus,
  ItemIntendedDifficulty,
  ItemReviewStatus,
  ItemStatus,
  PilotFormStatus,
  Prisma,
  PsychometricFlagReviewStatus,
  PsychometricItemStatus,
  SessionStatus,
  AssessmentDomain,
  AssessmentSectionType,
  AnalyticsExportRequestStatus,
  AnalyticsExportGovernanceSetting,
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
  CreateInternalDraftItemInput,
  CreateInternalItemFormMappingInput,
  ActivateInternalItemInput,
  UpdateInternalItemStatusInput,
  UpdateInternalDraftItemInput,
  InternalPilotFormBlueprintValidationOutput,
  InternalPilotFormOutput,
  UpdatePilotFormStatusInput,
  CreateInternalAssessmentFormInput,
  CreateAnalyticsExportRequestInput,
  InternalAnalyticsExportRequestOutput,
  ReviewAnalyticsExportRequestInput,
  GenerateAnalyticsExportRequestInput,
  InternalAnalyticsExportFileOutput,
  DirectAnalyticsExportInput,
  InternalAnalyticsExportGovernanceSettingOutput,
  UpdateAnalyticsExportGovernanceSettingInput,
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
  psychometricMetrics: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  },
  psychometricFlags: {
    where: {
      status: PsychometricFlagReviewStatus.OPEN,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  },
} satisfies Prisma.ItemInclude;

type AnalyticsExportRequestWithRelations =
  Prisma.AnalyticsExportRequestGetPayload<{
    include: {
      requestedBy: true;
      reviewedBy: true;
    };
  }>;

type SessionWithInternalRelations = Prisma.SessionGetPayload<{
  include: typeof sessionInclude;
}>;

type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: typeof auditLogInclude;
}>;

type ItemWithInternalRelations = Prisma.ItemGetPayload<{
  include: typeof itemInclude;
}>;

const pilotFormInclude = {
  sections: {
    orderBy: {
      orderIndex: 'asc',
    },
  },
  items: {
    include: {
      item: true,
      section: true,
    },
    orderBy: {
      orderIndex: 'asc',
    },
  },
} satisfies Prisma.AssessmentFormInclude;

type PilotFormWithInternalRelations = Prisma.AssessmentFormGetPayload<{
  include: typeof pilotFormInclude;
}>;

type InternalApiRole = 'PLATFORM_ADMIN' | 'RESEARCHER';

const IQMERIDIAN_PILOT_FORM_NAME =
  'IQMeridian General Cognitive Ability Pilot Form';

const IQMERIDIAN_PILOT_VERSION_LABEL = 'v0.1';

const PILOT_BLUEPRINT: Record<AssessmentDomain, number> = {
  [AssessmentDomain.VERBAL_REASONING]: 8,
  [AssessmentDomain.NUMERICAL_REASONING]: 8,
  [AssessmentDomain.ABSTRACT_REASONING]: 10,
  [AssessmentDomain.LOGICAL_REASONING]: 8,
  [AssessmentDomain.ANALYTICAL_PROBLEM_SOLVING]: 6,
};

const PILOT_TIMING_RULES = {
  totalRecommendedMinutes: 45,
  sectionTiming: {
    VERBAL_REASONING: 480,
    NUMERICAL_REASONING: 600,
    ABSTRACT_REASONING: 720,
    LOGICAL_REASONING: 600,
    ANALYTICAL_PROBLEM_SOLVING: 480,
  },
};

const LOCKED_FORM_STATUSES = [
  PilotFormStatus.LOCKED_FOR_PILOT,
  PilotFormStatus.ACTIVE_PILOT,
] as const;

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
  async createFormalPilotForm(): Promise<InternalPilotFormOutput> {
    const existing = await this.prisma.assessmentForm.findFirst({
      where: {
        name: IQMERIDIAN_PILOT_FORM_NAME,
        versionLabel: IQMERIDIAN_PILOT_VERSION_LABEL,
      },
      include: pilotFormInclude,
    });

    if (existing) {
      return this.toInternalPilotFormOutput(existing);
    }

    const form = await this.prisma.assessmentForm.create({
      data: {
        name: IQMERIDIAN_PILOT_FORM_NAME,
        version: 1,
        versionLabel: IQMERIDIAN_PILOT_VERSION_LABEL,
        isActive: false,
        pilotStatus: PilotFormStatus.DRAFT,
        isLocked: false,
        domainBlueprint: this.toJsonValue(PILOT_BLUEPRINT),
        timingRules: this.toJsonValue(PILOT_TIMING_RULES),
        scoringVersion: 1,
        reportVersion: 1,
        sections: {
          create: [
            {
              type: 'VERBAL',
              domain: AssessmentDomain.VERBAL_REASONING,
              title: 'Verbal reasoning',
              timeLimitSec: 480,
              orderIndex: 1,
            },
            {
              type: 'NUMERICAL',
              domain: AssessmentDomain.NUMERICAL_REASONING,
              title: 'Numerical reasoning',
              timeLimitSec: 600,
              orderIndex: 2,
            },
            {
              type: 'ABSTRACT',
              domain: AssessmentDomain.ABSTRACT_REASONING,
              title: 'Abstract reasoning',
              timeLimitSec: 720,
              orderIndex: 3,
            },
            {
              type: 'LOGICAL',
              domain: AssessmentDomain.LOGICAL_REASONING,
              title: 'Logical reasoning',
              timeLimitSec: 600,
              orderIndex: 4,
            },
            {
              type: 'ANALYTICAL',
              domain: AssessmentDomain.ANALYTICAL_PROBLEM_SOLVING,
              title: 'Analytical problem-solving',
              timeLimitSec: 480,
              orderIndex: 5,
            },
          ],
        },
      },
      include: pilotFormInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PILOT_FORM_CREATED',
        entityType: 'AssessmentForm',
        entityId: form.id,
        metadata: this.toJsonValue({
          name: form.name,
          version: form.version,
          versionLabel: form.versionLabel,
          pilotStatus: form.pilotStatus,
          blueprint: PILOT_BLUEPRINT,
          timingRules: PILOT_TIMING_RULES,
          scoringVersion: form.scoringVersion,
          reportVersion: form.reportVersion,
        }),
      },
    });

    return this.toInternalPilotFormOutput(form);
  }
  async getInternalAssessmentForms() {
    const forms = await this.prisma.assessmentForm.findMany({
      include: pilotFormInclude,
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return forms.map((form) => this.toInternalPilotFormOutput(form));
  }

  async createInternalAssessmentForm(input: CreateInternalAssessmentFormInput) {
    const name = input.name.trim();

    if (!name) {
      throw new BadRequestException('Form name is required.');
    }

    const version =
      typeof input.version === 'number' && input.version > 0
        ? input.version
        : 1;

    const versionLabel =
      input.versionLabel && input.versionLabel.trim().length > 0
        ? input.versionLabel.trim()
        : `v${version}`;

    const scoringVersion =
      typeof input.scoringVersion === 'number' && input.scoringVersion > 0
        ? input.scoringVersion
        : 1;

    const reportVersion =
      typeof input.reportVersion === 'number' && input.reportVersion > 0
        ? input.reportVersion
        : 1;

    const pilotStatus = this.parsePilotFormStatus(
      input.pilotStatus ?? PilotFormStatus.DRAFT,
    );

    const sections =
      input.sections && input.sections.length > 0
        ? input.sections.map((section, index) => ({
            type: this.parseAssessmentSectionType(section.type),
            domain: this.parseAssessmentDomain(section.domain),
            title: section.title.trim(),
            timeLimitSec:
              typeof section.timeLimitSec === 'number' &&
              section.timeLimitSec > 0
                ? section.timeLimitSec
                : 600,
            orderIndex:
              typeof section.orderIndex === 'number' && section.orderIndex > 0
                ? section.orderIndex
                : index + 1,
          }))
        : input.createStandardSections === false
          ? []
          : [
              {
                type: AssessmentSectionType.VERBAL,
                domain: AssessmentDomain.VERBAL_REASONING,
                title: 'Verbal reasoning',
                timeLimitSec: 480,
                orderIndex: 1,
              },
              {
                type: AssessmentSectionType.NUMERICAL,
                domain: AssessmentDomain.NUMERICAL_REASONING,
                title: 'Numerical reasoning',
                timeLimitSec: 600,
                orderIndex: 2,
              },
              {
                type: AssessmentSectionType.ABSTRACT,
                domain: AssessmentDomain.ABSTRACT_REASONING,
                title: 'Abstract reasoning',
                timeLimitSec: 720,
                orderIndex: 3,
              },
              {
                type: AssessmentSectionType.LOGICAL,
                domain: AssessmentDomain.LOGICAL_REASONING,
                title: 'Logical reasoning',
                timeLimitSec: 600,
                orderIndex: 4,
              },
              {
                type: AssessmentSectionType.ANALYTICAL,
                domain: AssessmentDomain.ANALYTICAL_PROBLEM_SOLVING,
                title: 'Analytical problem-solving',
                timeLimitSec: 480,
                orderIndex: 5,
              },
            ];

    if (sections.some((section) => !section.title)) {
      throw new BadRequestException('Every section must have a title.');
    }

    const createdForm = await this.prisma.assessmentForm.create({
      data: {
        name,
        version,
        versionLabel,
        isActive: input.isActive === true,
        pilotStatus,
        isLocked: false,
        domainBlueprint:
          input.domainBlueprint === undefined
            ? {
                VERBAL_REASONING: 8,
                NUMERICAL_REASONING: 8,
                ABSTRACT_REASONING: 10,
                LOGICAL_REASONING: 8,
                ANALYTICAL_PROBLEM_SOLVING: 6,
              }
            : this.toInputJsonValue(input.domainBlueprint),
        timingRules:
          input.timingRules === undefined
            ? {
                totalRecommendedMinutes: 45,
                sectionTiming: {
                  VERBAL_REASONING: 480,
                  NUMERICAL_REASONING: 600,
                  ABSTRACT_REASONING: 720,
                  LOGICAL_REASONING: 600,
                  ANALYTICAL_PROBLEM_SOLVING: 480,
                },
              }
            : this.toInputJsonValue(input.timingRules),
        scoringVersion,
        reportVersion,
        sections: {
          create: sections,
        },
      },
      include: pilotFormInclude,
    });

    await this.recordInternalAuditEvent({
      action: 'ASSESSMENT_FORM_CREATED',
      entityType: 'AssessmentForm',
      entityId: createdForm.id,
      metadata: {
        summary: `Created assessment form ${createdForm.name} ${
          createdForm.versionLabel ?? `v${createdForm.version}`
        }.`,
        formId: createdForm.id,
        name: createdForm.name,
        version: createdForm.version,
        versionLabel: createdForm.versionLabel,
        pilotStatus: createdForm.pilotStatus,
        sectionCount: createdForm.sections.length,
      },
    });

    return this.toInternalPilotFormOutput(createdForm);
  }

  async getInternalPilotForms(): Promise<InternalPilotFormOutput[]> {
    const forms = await this.prisma.assessmentForm.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: pilotFormInclude,
    });

    return forms.map((form) => this.toInternalPilotFormOutput(form));
  }

  async getInternalPilotFormById(
    formId: string,
  ): Promise<InternalPilotFormOutput | undefined> {
    const form = await this.prisma.assessmentForm.findUnique({
      where: { id: formId },
      include: pilotFormInclude,
    });

    if (!form) {
      return undefined;
    }

    return this.toInternalPilotFormOutput(form);
  }

  async validatePilotFormBlueprint(
    formId: string,
  ): Promise<InternalPilotFormBlueprintValidationOutput> {
    const form = await this.prisma.assessmentForm.findUnique({
      where: { id: formId },
      include: pilotFormInclude,
    });

    if (!form) {
      throw new NotFoundException('Pilot form was not found.');
    }

    return this.buildPilotBlueprintValidation(form);
  }

  async updatePilotFormStatus(
    formId: string,
    input: UpdatePilotFormStatusInput,
    actorRole: InternalApiRole,
  ): Promise<InternalPilotFormOutput> {
    if (
      !Object.values(PilotFormStatus).includes(input.status as PilotFormStatus)
    ) {
      throw new BadRequestException('Unsupported pilot form status.');
    }

    const nextStatus = input.status as PilotFormStatus;

    const form = await this.prisma.assessmentForm.findUnique({
      where: { id: formId },
      include: pilotFormInclude,
    });

    if (!form) {
      throw new NotFoundException('Pilot form was not found.');
    }

    const previousStatus = form.pilotStatus;
    const validation = this.buildPilotBlueprintValidation(form);

    if (this.isLockedPilotStatus(nextStatus) && !validation.isValid) {
      throw new BadRequestException(
        `Pilot form cannot be locked or activated until blueprint validation passes: ${validation.errors.join(
          '; ',
        )}`,
      );
    }

    if (this.isLockedPilotForm(form) && previousStatus !== nextStatus) {
      this.assertLockedFormOverrideAllowed({
        actorRole,
        overrideReason: input.overrideReason,
        operation: 'changing locked pilot form status',
      });
    }

    const shouldLock = this.isLockedPilotStatus(nextStatus);

    const updatedForm = await this.prisma.assessmentForm.update({
      where: { id: form.id },
      data: {
        pilotStatus: nextStatus,
        isLocked: shouldLock || form.isLocked,
        isActive: nextStatus === PilotFormStatus.ACTIVE_PILOT,
        lockedAt: shouldLock && !form.lockedAt ? new Date() : form.lockedAt,
        lockedBy: shouldLock && !form.lockedBy ? actorRole : form.lockedBy,
      },
      include: pilotFormInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: this.isLockedPilotStatus(previousStatus)
          ? 'LOCKED_PILOT_FORM_STATUS_OVERRIDDEN'
          : 'PILOT_FORM_STATUS_UPDATED',
        entityType: 'AssessmentForm',
        entityId: form.id,
        metadata: this.toJsonValue({
          formId: form.id,
          previousStatus,
          newStatus: nextStatus,
          isLocked: updatedForm.isLocked,
          overrideReason: input.overrideReason ?? null,
          validation,
        }),
      },
    });

    return this.toInternalPilotFormOutput(updatedForm);
  }
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

  async updateInternalDraftItem(
    itemId: string,
    input: UpdateInternalDraftItemInput,
    actorRole: InternalApiRole,
  ): Promise<InternalItemDetailOutput> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: itemInclude,
    });

    if (!item) {
      throw new NotFoundException('Internal item record was not found.');
    }

    if (item.status !== ItemStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft items can be edited. Return the item to draft or create a new version before editing.',
      );
    }

    const updateData: Prisma.ItemUpdateInput = {};
    const changedFields: string[] = [];

    if (input.domain !== undefined) {
      const domain = input.domain.trim();

      if (domain.length === 0) {
        throw new BadRequestException('Domain cannot be empty.');
      }

      if (
        !Object.values(AssessmentDomain).includes(domain as AssessmentDomain)
      ) {
        throw new BadRequestException('Unsupported assessment domain.');
      }

      updateData.domain = domain as AssessmentDomain;
      changedFields.push('domain');
    }

    if (input.itemType !== undefined) {
      const itemType = input.itemType.trim();

      if (itemType.length === 0) {
        throw new BadRequestException('Item type cannot be empty.');
      }

      updateData.itemType = itemType;
      changedFields.push('itemType');
    }

    if (input.prompt !== undefined) {
      const prompt = input.prompt.trim();

      if (prompt.length === 0) {
        throw new BadRequestException('Prompt cannot be empty.');
      }

      updateData.prompt = prompt;
      changedFields.push('prompt');
    }

    if (input.options !== undefined) {
      updateData.options = this.toJsonValue(input.options);
      changedFields.push('options');
    }

    if (input.correctAnswer !== undefined) {
      updateData.correctAnswer = this.toJsonValue(input.correctAnswer);
      changedFields.push('correctAnswer');
    }

    if (input.difficulty !== undefined) {
      updateData.difficulty =
        input.difficulty && input.difficulty.trim().length > 0
          ? input.difficulty.trim()
          : null;
      changedFields.push('difficulty');
    }

    if (input.subdomain !== undefined) {
      updateData.subdomain = this.normaliseNullableString(input.subdomain);
      changedFields.push('subdomain');
    }

    if (input.itemFamily !== undefined) {
      updateData.itemFamily = this.normaliseNullableString(input.itemFamily);
      changedFields.push('itemFamily');
    }

    if (input.stimulusType !== undefined) {
      updateData.stimulusType = this.normaliseNullableString(
        input.stimulusType,
      );
      changedFields.push('stimulusType');
    }

    if (input.scoringRule !== undefined) {
      updateData.scoringRule =
        this.normaliseNullableString(input.scoringRule) ?? null;
      changedFields.push('scoringRule');
    }

    if (input.intendedDifficulty !== undefined) {
      updateData.intendedDifficulty = this.parseIntendedDifficulty(
        input.intendedDifficulty,
      );
      changedFields.push('intendedDifficulty');
    }

    if (input.estimatedResponseTimeSec !== undefined) {
      if (
        input.estimatedResponseTimeSec !== null &&
        input.estimatedResponseTimeSec <= 0
      ) {
        throw new BadRequestException(
          'Estimated response time must be greater than zero.',
        );
      }

      updateData.estimatedResponseTimeSec = input.estimatedResponseTimeSec;
      changedFields.push('estimatedResponseTimeSec');
    }

    if (input.cognitiveProcess !== undefined) {
      updateData.cognitiveProcess = this.normaliseNullableString(
        input.cognitiveProcess,
      );
      changedFields.push('cognitiveProcess');
    }

    if (input.itemRationale !== undefined) {
      updateData.itemRationale = this.normaliseNullableString(
        input.itemRationale,
      );
      changedFields.push('itemRationale');
    }

    if (input.distractorRationale !== undefined) {
      updateData.distractorRationale = this.toJsonValue(
        input.distractorRationale,
      );
      changedFields.push('distractorRationale');
    }

    if (input.reviewStatus !== undefined) {
      updateData.reviewStatus = this.parseItemReviewStatus(input.reviewStatus);
      changedFields.push('reviewStatus');
    }

    if (input.psychometricStatus !== undefined) {
      updateData.psychometricStatus = this.parsePsychometricItemStatus(
        input.psychometricStatus,
      );
      changedFields.push('psychometricStatus');
    }

    if (changedFields.length === 0) {
      throw new BadRequestException('No editable item fields were provided.');
    }

    updateData.version = {
      increment: 1,
    };

    const mergedPilotReadyCandidate = {
      domain:
        updateData.domain !== undefined
          ? (updateData.domain as AssessmentDomain)
          : item.domain,
      subdomain:
        updateData.subdomain !== undefined
          ? (updateData.subdomain as string | null)
          : item.subdomain,
      itemFamily:
        updateData.itemFamily !== undefined
          ? (updateData.itemFamily as string | null)
          : item.itemFamily,
      intendedDifficulty:
        updateData.intendedDifficulty !== undefined
          ? (updateData.intendedDifficulty as ItemIntendedDifficulty | null)
          : item.intendedDifficulty,
      estimatedResponseTimeSec:
        updateData.estimatedResponseTimeSec !== undefined
          ? (updateData.estimatedResponseTimeSec as number | null)
          : item.estimatedResponseTimeSec,
      correctAnswer:
        updateData.correctAnswer !== undefined
          ? input.correctAnswer
          : item.correctAnswer,
      options: updateData.options !== undefined ? input.options : item.options,
      itemRationale:
        updateData.itemRationale !== undefined
          ? (updateData.itemRationale as string | null)
          : item.itemRationale,
      scoringRule:
        updateData.scoringRule !== undefined
          ? (updateData.scoringRule as string | null)
          : item.scoringRule,
      reviewStatus:
        updateData.reviewStatus !== undefined
          ? (updateData.reviewStatus as ItemReviewStatus)
          : item.reviewStatus,
      psychometricStatus:
        updateData.psychometricStatus !== undefined
          ? (updateData.psychometricStatus as PsychometricItemStatus)
          : item.psychometricStatus,
    };

    if (
      mergedPilotReadyCandidate.psychometricStatus ===
      PsychometricItemStatus.PILOT_READY
    ) {
      this.assertPilotReadyItemMetadata(mergedPilotReadyCandidate);
    }

    const lockedFormAssociations = await this.prisma.formItemMapping.findMany({
      where: {
        itemId: item.id,
        form: {
          OR: [
            { isLocked: true },
            { pilotStatus: PilotFormStatus.LOCKED_FOR_PILOT },
            { pilotStatus: PilotFormStatus.ACTIVE_PILOT },
          ],
        },
      },
      include: {
        form: true,
      },
    });

    const protectedLockedFormChanges = changedFields.filter((field) =>
      ['correctAnswer', 'scoringRule'].includes(field),
    );

    if (
      lockedFormAssociations.length > 0 &&
      protectedLockedFormChanges.length > 0
    ) {
      this.assertLockedFormOverrideAllowed({
        actorRole,
        overrideReason: input.overrideReason,
        operation: `changing ${protectedLockedFormChanges.join(
          ', ',
        )} for an item linked to a locked pilot form`,
      });
    }
    const updatedItem = await this.prisma.item.update({
      where: { id: item.id },
      data: updateData,
      include: itemInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'ITEM_UPDATED',
        entityType: 'Item',
        entityId: item.id,
        metadata: this.toJsonValue({
          itemId: item.id,
          previousStatus: item.status,
          status: updatedItem.status,
          previousVersion: item.version,
          newVersion: updatedItem.version,
          changedFields,
          note: input.note ?? null,
          lockedFormOverride:
            lockedFormAssociations.length > 0 &&
            protectedLockedFormChanges.length > 0,
          lockedFormIds: lockedFormAssociations.map(
            (mapping) => mapping.formId,
          ),
          protectedLockedFormChanges,
          overrideReason: input.overrideReason ?? null,
        }),
      },
    });

    const reloadedItem = await this.getInternalItemById(updatedItem.id);

    if (!reloadedItem) {
      throw new Error('Updated item could not be reloaded.');
    }

    return reloadedItem;
  }

  async updateInternalItemStatus(
    itemId: string,
    input: UpdateInternalItemStatusInput,
  ): Promise<InternalItemDetailOutput> {
    const nextStatus = input.status as ItemStatus;

    const allowedStatuses = [
      ItemStatus.DRAFT,
      ItemStatus.UNDER_REVIEW,
      ItemStatus.ACTIVE,
      ItemStatus.RETIRED,
    ];

    if (!allowedStatuses.includes(nextStatus)) {
      throw new BadRequestException('Unsupported item status.');
    }

    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: itemInclude,
    });

    if (!item) {
      throw new NotFoundException('Internal item record was not found.');
    }

    if (item.status === nextStatus) {
      const unchangedItem = await this.getInternalItemById(item.id);

      if (!unchangedItem) {
        throw new Error('Item could not be reloaded.');
      }

      return unchangedItem;
    }

    if (item.status === ItemStatus.RETIRED) {
      throw new BadRequestException(
        'Retired items cannot be changed silently. Create a new version instead.',
      );
    }

    if (item.status === ItemStatus.ACTIVE && nextStatus === ItemStatus.DRAFT) {
      throw new BadRequestException(
        'Active items cannot be returned to draft silently. Retire the item or create a new version.',
      );
    }

    const activeMappingCount = item.formMappings.filter(
      (mapping) => mapping.status === FormItemMappingStatus.ACTIVE,
    ).length;

    if (nextStatus === ItemStatus.ACTIVE && activeMappingCount === 0) {
      throw new BadRequestException(
        'Item must be attached to at least one active form mapping before activation.',
      );
    }

    const updatedItem = await this.prisma.item.update({
      where: { id: item.id },
      data: {
        status: nextStatus,
      },
      include: itemInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: this.getItemStatusAuditAction(nextStatus),
        entityType: 'Item',
        entityId: item.id,
        metadata: this.toJsonValue({
          itemId: item.id,
          previousStatus: item.status,
          newStatus: nextStatus,
          activeMappingCount,
          note: input.note ?? null,
        }),
      },
    });

    const reloadedItem = await this.getInternalItemById(updatedItem.id);

    if (!reloadedItem) {
      throw new Error('Updated item could not be reloaded.');
    }

    return reloadedItem;
  }

  async activateInternalItem(
    itemId: string,
    input: ActivateInternalItemInput,
  ): Promise<InternalItemDetailOutput> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: itemInclude,
    });

    if (!item) {
      throw new NotFoundException('Internal item record was not found.');
    }

    if (item.status === ItemStatus.ACTIVE) {
      const activeItem = await this.getInternalItemById(item.id);

      if (!activeItem) {
        throw new Error('Active item could not be reloaded.');
      }

      return activeItem;
    }

    if (item.status === ItemStatus.RETIRED) {
      throw new BadRequestException(
        'Retired items cannot be reactivated silently. Create a new version instead.',
      );
    }

    const activeMappingCount = item.formMappings.filter(
      (mapping) => mapping.status === FormItemMappingStatus.ACTIVE,
    ).length;

    if (activeMappingCount === 0) {
      throw new BadRequestException(
        'Item must be attached to at least one active form mapping before activation.',
      );
    }

    const updatedItem = await this.prisma.item.update({
      where: { id: item.id },
      data: {
        status: ItemStatus.ACTIVE,
      },
      include: itemInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'ITEM_ACTIVATED',
        entityType: 'Item',
        entityId: item.id,
        metadata: this.toJsonValue({
          itemId: item.id,
          previousStatus: item.status,
          newStatus: ItemStatus.ACTIVE,
          activeMappingCount,
          note: input.note ?? null,
        }),
      },
    });

    const activatedItem = await this.getInternalItemById(updatedItem.id);

    if (!activatedItem) {
      throw new Error('Activated item could not be reloaded.');
    }

    return activatedItem;
  }
  async createInternalDraftItem(
    input: CreateInternalDraftItemInput,
  ): Promise<InternalItemDetailOutput> {
    const itemId =
      input.id && input.id.trim().length > 0
        ? input.id.trim()
        : `draft-item-${randomUUID()}`;

    const requestedPsychometricStatus =
      this.parsePsychometricItemStatus(input.psychometricStatus) ??
      PsychometricItemStatus.DRAFT;

    if (requestedPsychometricStatus === PsychometricItemStatus.PILOT_READY) {
      this.assertPilotReadyItemMetadata({
        domain: input.domain as AssessmentDomain,
        subdomain: this.normaliseNullableString(input.subdomain) ?? null,
        itemFamily: this.normaliseNullableString(input.itemFamily) ?? null,
        intendedDifficulty:
          this.parseIntendedDifficulty(input.intendedDifficulty) ?? null,
        estimatedResponseTimeSec:
          input.estimatedResponseTimeSec ??
          input.timeExpectationSeconds ??
          null,
        correctAnswer: input.correctAnswer,
        options: input.options,
        itemRationale:
          this.normaliseNullableString(input.itemRationale) ??
          this.normaliseNullableString(input.explanationNotes) ??
          null,
        scoringRule:
          this.normaliseNullableString(input.scoringRule) ?? 'BINARY_CORRECT',
        reviewStatus:
          this.parseItemReviewStatus(input.reviewStatus) ??
          ItemReviewStatus.NOT_REVIEWED,
        psychometricStatus: requestedPsychometricStatus,
      });
    }

    const item = await this.prisma.item.create({
      data: {
        id: itemId,
        domain: input.domain as AssessmentDomain,
        subdomain: this.normaliseNullableString(input.subdomain) ?? null,
        itemFamily: this.normaliseNullableString(input.itemFamily) ?? null,
        itemType: input.itemType,
        stimulusType: this.normaliseNullableString(input.stimulusType) ?? null,
        prompt: input.prompt,
        options: this.toJsonValue(input.options),
        correctAnswer: this.toJsonValue(input.correctAnswer),
        scoringRule:
          this.normaliseNullableString(input.scoringRule) ?? 'BINARY_CORRECT',
        difficulty: input.difficulty,
        intendedDifficulty:
          this.parseIntendedDifficulty(input.intendedDifficulty) ?? null,
        estimatedResponseTimeSec:
          input.estimatedResponseTimeSec ??
          input.timeExpectationSeconds ??
          null,
        cognitiveProcess:
          this.normaliseNullableString(input.cognitiveProcess) ?? null,
        itemRationale:
          this.normaliseNullableString(input.itemRationale) ??
          this.normaliseNullableString(input.explanationNotes) ??
          null,
        distractorRationale:
          input.distractorRationale !== undefined
            ? this.toJsonValue(input.distractorRationale)
            : input.distractorRationaleLegacy !== undefined
              ? this.toJsonValue(input.distractorRationaleLegacy)
              : undefined,
        reviewStatus:
          this.parseItemReviewStatus(input.reviewStatus) ??
          ItemReviewStatus.NOT_REVIEWED,
        psychometricStatus:
          this.parsePsychometricItemStatus(input.psychometricStatus) ??
          PsychometricItemStatus.DRAFT,
        status: ItemStatus.DRAFT,
        version: 1,
      } as Prisma.ItemCreateInput,
      include: itemInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'ITEM_CREATED',
        entityType: 'Item',
        entityId: item.id,
        metadata: this.toJsonValue({
          domain: input.domain,
          itemType: input.itemType,
          status: ItemStatus.DRAFT,
          difficulty: input.difficulty,
          distractorRationale: input.distractorRationale ?? null,
          timeExpectationSeconds: input.timeExpectationSeconds ?? null,
          explanationNotes: input.explanationNotes ?? null,
          assetLinkage: input.assetLinkage ?? null,
          subdomain: input.subdomain ?? null,
          itemFamily: input.itemFamily ?? null,
          stimulusType: input.stimulusType ?? null,
          intendedDifficulty: input.intendedDifficulty ?? null,
          estimatedResponseTimeSec:
            input.estimatedResponseTimeSec ??
            input.timeExpectationSeconds ??
            null,
          cognitiveProcess: input.cognitiveProcess ?? null,
          itemRationale: input.itemRationale ?? input.explanationNotes ?? null,
          scoringRule: input.scoringRule ?? 'BINARY_CORRECT',
          reviewStatus: input.reviewStatus ?? ItemReviewStatus.NOT_REVIEWED,
          psychometricStatus:
            input.psychometricStatus ?? PsychometricItemStatus.DRAFT,
        }),
      },
    });

    const createdItem = await this.getInternalItemById(item.id);

    if (!createdItem) {
      throw new Error('Created item could not be reloaded.');
    }

    return createdItem;
  }

  async attachInternalItemToForm(
    itemId: string,
    input: CreateInternalItemFormMappingInput,
    actorRole: InternalApiRole,
  ): Promise<InternalItemTraceabilityOutput> {
    if (!input.formId || input.formId.trim().length === 0) {
      throw new BadRequestException('Form ID is required.');
    }

    const [item, form] = await Promise.all([
      this.prisma.item.findUnique({
        where: { id: itemId },
      }),
      this.prisma.assessmentForm.findUnique({
        where: { id: input.formId },
      }),
    ]);

    if (!item) {
      throw new NotFoundException('Internal item record was not found.');
    }

    if (!form) {
      throw new NotFoundException('Assessment form was not found.');
    }

    if (this.isLockedPilotForm(form)) {
      this.assertLockedFormOverrideAllowed({
        actorRole,
        overrideReason: input.overrideReason,
        operation: 'adding or replacing items on a locked pilot form',
      });
    }

    if (
      this.isLockedPilotForm(form) &&
      item.psychometricStatus !== PsychometricItemStatus.PILOT_READY
    ) {
      throw new BadRequestException(
        'Only pilot-ready items can be added to a locked or active pilot form.',
      );
    }

    if (
      this.isLockedPilotForm(form) &&
      item.reviewStatus !== ItemReviewStatus.APPROVED_FOR_PILOT
    ) {
      throw new BadRequestException(
        'Only content-approved items can be added to a locked or active pilot form.',
      );
    }

    if (input.sectionId && input.sectionId.trim().length > 0) {
      const section = await this.prisma.assessmentSection.findUnique({
        where: { id: input.sectionId },
      });

      if (!section) {
        throw new NotFoundException('Assessment section was not found.');
      }
    }

    const mappingStatus =
      input.status === FormItemMappingStatus.INACTIVE
        ? FormItemMappingStatus.INACTIVE
        : FormItemMappingStatus.ACTIVE;

    try {
      await this.prisma.formItemMapping.create({
        data: {
          itemId,
          formId: input.formId,
          sectionId:
            input.sectionId && input.sectionId.trim().length > 0
              ? input.sectionId
              : null,
          orderIndex: input.orderIndex ?? 0,
          status: mappingStatus,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This item is already attached to the selected form or section.',
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'The selected form, section, or item could not be linked because one of the references is invalid.',
        );
      }

      throw error;
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'ITEM_ATTACHED_TO_FORM',
        entityType: 'Item',
        entityId: itemId,
        metadata: this.toJsonValue({
          itemId,
          formId: input.formId,
          sectionId: input.sectionId ?? null,
          orderIndex: input.orderIndex ?? 0,
          status: mappingStatus,
          formPilotStatus: form.pilotStatus,
          formLocked: form.isLocked,
          itemPsychometricStatus: item.psychometricStatus,
          itemReviewStatus: item.reviewStatus,
          overrideReason: input.overrideReason ?? null,
        }),
      },
    });

    const traceability = await this.getInternalItemTraceability(itemId);

    if (!traceability) {
      throw new Error('Item traceability could not be reloaded.');
    }

    return traceability;
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
          session.applicantName ??
          session.user?.name ??
          session.applicantEmail ??
          session.user?.email ??
          session.userId ??
          session.id,
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
      exportRequestCounts,
      pendingExportRequests,
    ] = await Promise.all([
      this.prisma.organisation.count(),
      this.prisma.campaign.count({
        where: {
          status: CampaignStatus.ACTIVE,
        },
      }),
      this.getUserCountsByRole(),
      this.getInternalAuditEvents(),
      this.getAnalyticsExportRequestCounts(),
      this.getPendingAnalyticsExportRequests(),
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
          event.action.includes('ITEM_RETIRED') ||
          event.action.includes('ITEM_MARKED_UNDER_REVIEW') ||
          event.action.includes('ITEM_RETURNED_TO_DRAFT') ||
          event.action.includes('ITEM_UPDATED'),
      ),
      exportRequestCounts,
      pendingExportRequests,
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

  async getAnalyticsExportRequests(
    roleHeader?: string,
  ): Promise<InternalAnalyticsExportRequestOutput[]> {
    const requests = await this.prisma.analyticsExportRequest.findMany({
      where:
        roleHeader === 'RESEARCHER'
          ? {
              requestedRole: 'RESEARCHER',
            }
          : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
      include: {
        requestedBy: true,
        reviewedBy: true,
      },
    });

    return requests.map((request) =>
      this.toInternalAnalyticsExportRequestOutput(request),
    );
  }

  async getAnalyticsExportGovernanceSetting(): Promise<InternalAnalyticsExportGovernanceSettingOutput> {
    const setting = await this.getOrCreateAnalyticsExportGovernanceSetting();

    return this.toInternalAnalyticsExportGovernanceSettingOutput(setting);
  }

  async updateAnalyticsExportGovernanceSetting(
    input: UpdateAnalyticsExportGovernanceSettingInput,
    actorRole?: string,
  ): Promise<InternalAnalyticsExportGovernanceSettingOutput> {
    const currentSetting =
      await this.getOrCreateAnalyticsExportGovernanceSetting();

    const approvalRequired =
      typeof input.approvalRequired === 'boolean'
        ? input.approvalRequired
        : currentSetting.approvalRequired;

    const updatedSetting =
      await this.prisma.analyticsExportGovernanceSetting.update({
        where: {
          id: currentSetting.id,
        },
        data: {
          approvalRequired,
          updatedByRole: actorRole ?? null,
        },
      });

    await this.recordInternalAuditEvent({
      action: 'ANALYTICS_EXPORT_GOVERNANCE_SETTING_UPDATED',
      entityType: 'AnalyticsExportGovernanceSetting',
      entityId: updatedSetting.id,
      metadata: {
        previousApprovalRequired: currentSetting.approvalRequired,
        nextApprovalRequired: updatedSetting.approvalRequired,
        actorRole: actorRole ?? null,
        updatedAt: updatedSetting.updatedAt.toISOString(),
      },
    });

    return this.toInternalAnalyticsExportGovernanceSettingOutput(
      updatedSetting,
    );
  }

  async recordAnalyticsExportRequest(
    input: CreateAnalyticsExportRequestInput,
    requestedRole?: string,
  ): Promise<InternalAnalyticsExportRequestOutput> {
    const definition = analyticsExportDefinitions.find(
      (candidate) => candidate.dataset === input.dataset,
    );

    if (!definition) {
      throw new BadRequestException('Unsupported analytics export dataset.');
    }

    if (!definition.currentlyAvailable) {
      throw new BadRequestException(
        'This analytics export is not currently available.',
      );
    }

    const requestedFormat = input.format ?? definition.format;

    if (requestedFormat !== definition.format) {
      throw new BadRequestException(
        `Unsupported export format for ${definition.dataset}. Expected ${definition.format}.`,
      );
    }

    const dateFrom = this.parseOptionalDate(input.dateFrom);
    const dateTo = this.parseOptionalDate(input.dateTo);

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException(
        'Export start date cannot be after end date.',
      );
    }

    const requestReason =
      input.requestReason && input.requestReason.trim().length > 0
        ? input.requestReason.trim()
        : null;

    if (!requestReason) {
      throw new BadRequestException('An export request reason is required.');
    }

    const governanceSetting =
      await this.getOrCreateAnalyticsExportGovernanceSetting();

    const shouldAutoGenerate = !governanceSetting.approvalRequired;
    const generatedAt = shouldAutoGenerate ? new Date() : null;
    const safeDataset = definition.dataset.toLowerCase().replaceAll('_', '-');
    const safeFormat = definition.format.toLowerCase();

    const fileKey = shouldAutoGenerate
      ? `exports/auto-approved/${safeDataset}-${generatedAt
          ?.toISOString()
          .replaceAll(':', '-')
          .replaceAll('.', '-')}.${safeFormat}`
      : null;

    const exportRequest = await this.prisma.analyticsExportRequest.create({
      data: {
        dataset: definition.dataset,
        format: definition.format,
        status: shouldAutoGenerate
          ? AnalyticsExportRequestStatus.GENERATED
          : AnalyticsExportRequestStatus.REQUESTED,
        dateFrom,
        dateTo,
        scope:
          input.scope === undefined || input.scope === null
            ? undefined
            : this.toJsonValue(input.scope),
        requestedRole: requestedRole ?? null,
        requestReason,
        reviewedAt: shouldAutoGenerate ? generatedAt : null,
        reviewDecision: shouldAutoGenerate ? 'AUTO_APPROVED' : null,
        reviewReason: shouldAutoGenerate
          ? 'Approval requirement was disabled by platform governance setting.'
          : null,
        generatedAt,
        fileKey,
        failureReason: null,
      },
      include: {
        requestedBy: true,
        reviewedBy: true,
      },
    });

    await this.recordInternalAuditEvent({
      action: 'ANALYTICS_EXPORT_REQUESTED',
      entityType: 'AnalyticsExportRequest',
      entityId: exportRequest.id,
      metadata: {
        exportRequestId: exportRequest.id,
        dataset: exportRequest.dataset,
        label: definition.label,
        format: exportRequest.format,
        status: exportRequest.status,
        requestedRole: requestedRole ?? null,
        requestReason,
        approvalRequired: governanceSetting.approvalRequired,
        autoGenerated: shouldAutoGenerate,
        dateFrom: exportRequest.dateFrom?.toISOString() ?? null,
        dateTo: exportRequest.dateTo?.toISOString() ?? null,
      },
    });

    if (shouldAutoGenerate) {
      await this.recordInternalAuditEvent({
        action: 'ANALYTICS_EXPORT_AUTO_APPROVED',
        entityType: 'AnalyticsExportRequest',
        entityId: exportRequest.id,
        metadata: {
          exportRequestId: exportRequest.id,
          dataset: exportRequest.dataset,
          format: exportRequest.format,
          requestedRole: requestedRole ?? null,
          reviewDecision: exportRequest.reviewDecision,
          reviewReason: exportRequest.reviewReason,
          generatedAt: exportRequest.generatedAt?.toISOString() ?? null,
          fileKey: exportRequest.fileKey,
        },
      });

      await this.recordInternalAuditEvent({
        action: 'ANALYTICS_EXPORT_GENERATED',
        entityType: 'AnalyticsExportRequest',
        entityId: exportRequest.id,
        metadata: {
          exportRequestId: exportRequest.id,
          dataset: exportRequest.dataset,
          format: exportRequest.format,
          requestedRole: requestedRole ?? null,
          autoGenerated: true,
          generatedAt: exportRequest.generatedAt?.toISOString() ?? null,
          fileKey: exportRequest.fileKey,
        },
      });
    }

    return this.toInternalAnalyticsExportRequestOutput(exportRequest);
  }

  async reviewAnalyticsExportRequest(
    requestId: string,
    input: ReviewAnalyticsExportRequestInput,
    reviewerRole?: string,
  ): Promise<InternalAnalyticsExportRequestOutput> {
    const exportRequest = await this.prisma.analyticsExportRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        requestedBy: true,
        reviewedBy: true,
      },
    });

    if (!exportRequest) {
      throw new NotFoundException('Analytics export request was not found.');
    }

    if (exportRequest.status !== AnalyticsExportRequestStatus.REQUESTED) {
      throw new BadRequestException(
        `Only requested exports can be reviewed. Current status is ${exportRequest.status}.`,
      );
    }

    if (input.decision !== 'APPROVED' && input.decision !== 'DECLINED') {
      throw new BadRequestException(
        'Export review decision must be APPROVED or DECLINED.',
      );
    }

    const reviewReason =
      input.reviewReason && input.reviewReason.trim().length > 0
        ? input.reviewReason.trim()
        : null;

    if (input.decision === 'DECLINED' && !reviewReason) {
      throw new BadRequestException(
        'A review reason is required when declining an export request.',
      );
    }

    const reviewedRequest = await this.prisma.analyticsExportRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status:
          input.decision === 'APPROVED'
            ? AnalyticsExportRequestStatus.APPROVED
            : AnalyticsExportRequestStatus.DECLINED,
        reviewedAt: new Date(),
        reviewDecision: input.decision,
        reviewReason,
      },
      include: {
        requestedBy: true,
        reviewedBy: true,
      },
    });

    await this.recordInternalAuditEvent({
      action:
        input.decision === 'APPROVED'
          ? 'ANALYTICS_EXPORT_APPROVED'
          : 'ANALYTICS_EXPORT_DECLINED',
      entityType: 'AnalyticsExportRequest',
      entityId: reviewedRequest.id,
      metadata: {
        exportRequestId: reviewedRequest.id,
        dataset: reviewedRequest.dataset,
        format: reviewedRequest.format,
        previousStatus: exportRequest.status,
        nextStatus: reviewedRequest.status,
        reviewerRole: reviewerRole ?? null,
        reviewDecision: reviewedRequest.reviewDecision,
        reviewReason: reviewedRequest.reviewReason,
        reviewedAt: reviewedRequest.reviewedAt?.toISOString() ?? null,
      },
    });

    return this.toInternalAnalyticsExportRequestOutput(reviewedRequest);
  }
  async generateAnalyticsExportRequest(
    requestId: string,
    input: GenerateAnalyticsExportRequestInput,
    generatorRole?: string,
  ): Promise<InternalAnalyticsExportRequestOutput> {
    const exportRequest = await this.prisma.analyticsExportRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        requestedBy: true,
        reviewedBy: true,
      },
    });

    if (!exportRequest) {
      throw new NotFoundException('Analytics export request was not found.');
    }

    if (exportRequest.status !== AnalyticsExportRequestStatus.APPROVED) {
      throw new BadRequestException(
        `Only approved exports can be generated. Current status is ${exportRequest.status}.`,
      );
    }

    const generationReason =
      input.generationReason && input.generationReason.trim().length > 0
        ? input.generationReason.trim()
        : null;

    const generatedAt = new Date();
    const safeDataset = exportRequest.dataset
      .toLowerCase()
      .replaceAll('_', '-');
    const safeFormat = exportRequest.format.toLowerCase();
    const fileKey = `exports/${exportRequest.id}/${safeDataset}-${generatedAt
      .toISOString()
      .replaceAll(':', '-')
      .replaceAll('.', '-')}.${safeFormat}`;

    await this.prisma.analyticsExportRequest.update({
      where: {
        id: exportRequest.id,
      },
      data: {
        status: AnalyticsExportRequestStatus.GENERATING,
      },
    });

    const generatedRequest = await this.prisma.analyticsExportRequest.update({
      where: {
        id: exportRequest.id,
      },
      data: {
        status: AnalyticsExportRequestStatus.GENERATED,
        generatedAt,
        fileKey,
        failureReason: null,
      },
      include: {
        requestedBy: true,
        reviewedBy: true,
      },
    });

    await this.recordInternalAuditEvent({
      action: 'ANALYTICS_EXPORT_GENERATED',
      entityType: 'AnalyticsExportRequest',
      entityId: generatedRequest.id,
      metadata: {
        exportRequestId: generatedRequest.id,
        dataset: generatedRequest.dataset,
        format: generatedRequest.format,
        previousStatus: exportRequest.status,
        nextStatus: generatedRequest.status,
        generatorRole: generatorRole ?? null,
        generationReason,
        generatedAt: generatedRequest.generatedAt?.toISOString() ?? null,
        fileKey: generatedRequest.fileKey,
      },
    });

    return this.toInternalAnalyticsExportRequestOutput(generatedRequest);
  }

  async downloadGeneratedAnalyticsExportRequest(
    requestId: string,
    downloaderRole?: string,
  ): Promise<InternalAnalyticsExportFileOutput> {
    const exportRequest = await this.prisma.analyticsExportRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        requestedBy: true,
        reviewedBy: true,
      },
    });

    if (!exportRequest) {
      throw new NotFoundException('Analytics export request was not found.');
    }

    if (exportRequest.status !== AnalyticsExportRequestStatus.GENERATED) {
      throw new BadRequestException(
        `Only generated exports can be downloaded. Current status is ${exportRequest.status}.`,
      );
    }

    const file = await this.buildAnalyticsExportFile(exportRequest);

    await this.recordInternalAuditEvent({
      action: 'ANALYTICS_EXPORT_DOWNLOADED',
      entityType: 'AnalyticsExportRequest',
      entityId: exportRequest.id,
      metadata: {
        exportRequestId: exportRequest.id,
        dataset: exportRequest.dataset,
        format: exportRequest.format,
        downloaderRole: downloaderRole ?? null,
        fileName: file.fileName,
        fileKey: exportRequest.fileKey,
        downloadedAt: new Date().toISOString(),
      },
    });

    return file;
  }

  async createDirectAnalyticsExport(
    input: DirectAnalyticsExportInput,
    actorRole?: string,
  ): Promise<InternalAnalyticsExportFileOutput> {
    const definition = analyticsExportDefinitions.find(
      (candidate) => candidate.dataset === input.dataset,
    );

    if (!definition) {
      throw new BadRequestException('Unsupported analytics export dataset.');
    }

    if (!definition.currentlyAvailable) {
      throw new BadRequestException(
        'This analytics export is not currently available.',
      );
    }

    const directReason =
      input.directReason && input.directReason.trim().length > 0
        ? input.directReason.trim()
        : null;

    if (!directReason) {
      throw new BadRequestException(
        'A direct export reason is required for platform-admin exports.',
      );
    }

    const requestedFormat = input.format ?? definition.format;

    if (requestedFormat !== definition.format) {
      throw new BadRequestException(
        `Unsupported export format for ${definition.dataset}. Expected ${definition.format}.`,
      );
    }

    const dateFrom = this.parseOptionalDate(input.dateFrom);
    const dateTo = this.parseOptionalDate(input.dateTo);

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException(
        'Export start date cannot be after end date.',
      );
    }

    const generatedAt = new Date();
    const safeDataset = definition.dataset.toLowerCase().replaceAll('_', '-');
    const safeFormat = definition.format.toLowerCase();
    const fileKey = `exports/direct/${definition.dataset}/${safeDataset}-${generatedAt
      .toISOString()
      .replaceAll(':', '-')
      .replaceAll('.', '-')}.${safeFormat}`;

    const exportRequest = await this.prisma.analyticsExportRequest.create({
      data: {
        dataset: definition.dataset,
        format: definition.format,
        status: AnalyticsExportRequestStatus.GENERATED,
        dateFrom,
        dateTo,
        scope:
          input.scope === undefined || input.scope === null
            ? undefined
            : this.toJsonValue(input.scope),
        requestedRole: actorRole ?? 'PLATFORM_ADMIN',
        requestReason: directReason,
        reviewedAt: generatedAt,
        reviewDecision: 'ADMIN_DIRECT_EXPORT',
        reviewReason: directReason,
        generatedAt,
        fileKey,
        failureReason: null,
      },
      include: {
        requestedBy: true,
        reviewedBy: true,
      },
    });

    await this.recordInternalAuditEvent({
      action: 'ANALYTICS_EXPORT_DIRECT_GENERATED',
      entityType: 'AnalyticsExportRequest',
      entityId: exportRequest.id,
      metadata: {
        exportRequestId: exportRequest.id,
        dataset: exportRequest.dataset,
        label: definition.label,
        format: exportRequest.format,
        status: exportRequest.status,
        actorRole: actorRole ?? null,
        directReason,
        dateFrom: exportRequest.dateFrom?.toISOString() ?? null,
        dateTo: exportRequest.dateTo?.toISOString() ?? null,
        generatedAt: exportRequest.generatedAt?.toISOString() ?? null,
        fileKey: exportRequest.fileKey,
      },
    });

    const file = await this.buildAnalyticsExportFile(exportRequest);

    await this.recordInternalAuditEvent({
      action: 'ANALYTICS_EXPORT_DOWNLOADED',
      entityType: 'AnalyticsExportRequest',
      entityId: exportRequest.id,
      metadata: {
        exportRequestId: exportRequest.id,
        dataset: exportRequest.dataset,
        format: exportRequest.format,
        downloaderRole: actorRole ?? null,
        directExport: true,
        fileName: file.fileName,
        fileKey: exportRequest.fileKey,
        downloadedAt: new Date().toISOString(),
      },
    });

    return file;
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

  private async getOrCreateAnalyticsExportGovernanceSetting(): Promise<AnalyticsExportGovernanceSetting> {
    return this.prisma.analyticsExportGovernanceSetting.upsert({
      where: {
        id: 'default',
      },
      update: {},
      create: {
        id: 'default',
      },
    });
  }

  private toInternalAnalyticsExportGovernanceSettingOutput(
    setting: AnalyticsExportGovernanceSetting,
  ): InternalAnalyticsExportGovernanceSettingOutput {
    return {
      approvalRequired: setting.approvalRequired,
      updatedByRole: setting.updatedByRole,
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString(),
    };
  }

  private async getAnalyticsExportRequestCounts() {
    const groupedRequests = await this.prisma.analyticsExportRequest.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const counts = {
      total: 0,
      requested: 0,
      approved: 0,
      declined: 0,
      generating: 0,
      generated: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const group of groupedRequests) {
      const count = group._count._all;

      counts.total += count;

      if (group.status === AnalyticsExportRequestStatus.REQUESTED) {
        counts.requested = count;
      }

      if (group.status === AnalyticsExportRequestStatus.APPROVED) {
        counts.approved = count;
      }

      if (group.status === AnalyticsExportRequestStatus.DECLINED) {
        counts.declined = count;
      }

      if (group.status === AnalyticsExportRequestStatus.GENERATING) {
        counts.generating = count;
      }

      if (group.status === AnalyticsExportRequestStatus.GENERATED) {
        counts.generated = count;
      }

      if (group.status === AnalyticsExportRequestStatus.FAILED) {
        counts.failed = count;
      }

      if (group.status === AnalyticsExportRequestStatus.CANCELLED) {
        counts.cancelled = count;
      }
    }

    return counts;
  }

  private async getPendingAnalyticsExportRequests(): Promise<
    InternalAnalyticsExportRequestOutput[]
  > {
    const requests = await this.prisma.analyticsExportRequest.findMany({
      where: {
        status: AnalyticsExportRequestStatus.REQUESTED,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 5,
      include: {
        requestedBy: true,
        reviewedBy: true,
      },
    });

    return requests.map((request) =>
      this.toInternalAnalyticsExportRequestOutput(request),
    );
  }

  private async buildAnalyticsExportFile(
    request: AnalyticsExportRequestWithRelations,
  ): Promise<InternalAnalyticsExportFileOutput> {
    const safeDataset = request.dataset.toLowerCase().replaceAll('_', '-');
    const safeTimestamp = new Date()
      .toISOString()
      .replaceAll(':', '-')
      .replaceAll('.', '-');

    if (request.dataset === 'CAMPAIGN_SUMMARY') {
      const rows = await this.buildCampaignSummaryExportRows(request);

      return {
        fileName: `${safeDataset}-${safeTimestamp}.json`,
        contentType: 'application/json',
        content: JSON.stringify(rows, null, 2),
      };
    }

    const rows = await this.buildCsvExportRows(request);

    return {
      fileName: `${safeDataset}-${safeTimestamp}.csv`,
      contentType: 'text/csv',
      content: this.toCsv(rows),
    };
  }

  private async buildCsvExportRows(
    request: AnalyticsExportRequestWithRelations,
  ): Promise<Record<string, unknown>[]> {
    if (request.dataset === 'ITEM_LEVEL') {
      return this.buildItemLevelExportRows(request);
    }

    if (request.dataset === 'SESSION_LEVEL') {
      return this.buildSessionLevelExportRows(request);
    }

    if (request.dataset === 'RESPONSE_LEVEL') {
      return this.buildResponseLevelExportRows(request);
    }

    if (request.dataset === 'SCORE_LEVEL') {
      return this.buildScoreLevelExportRows(request);
    }

    throw new BadRequestException(
      `Unsupported export dataset: ${request.dataset}`,
    );
  }

  private buildDateRangeWhere(
    request: Pick<AnalyticsExportRequestWithRelations, 'dateFrom' | 'dateTo'>,
  ): Prisma.DateTimeFilter | undefined {
    const where: Prisma.DateTimeFilter = {};

    if (request.dateFrom) {
      where.gte = request.dateFrom;
    }

    if (request.dateTo) {
      where.lte = request.dateTo;
    }

    return Object.keys(where).length === 0 ? undefined : where;
  }

  private async buildItemLevelExportRows(
    request: AnalyticsExportRequestWithRelations,
  ): Promise<Record<string, unknown>[]> {
    const createdAt = this.buildDateRangeWhere(request);

    const items = await this.prisma.item.findMany({
      where: createdAt
        ? {
            createdAt,
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        formMappings: true,
        psychometricFlags: true,
      },
    });

    return items.map((item) => ({
      itemId: item.id,
      domain: item.domain,
      subdomain: item.subdomain,
      itemFamily: item.itemFamily,
      itemType: item.itemType,
      stimulusType: item.stimulusType,
      status: item.status,
      reviewStatus: item.reviewStatus,
      psychometricStatus: item.psychometricStatus,
      difficulty: item.difficulty,
      intendedDifficulty: item.intendedDifficulty,
      estimatedResponseTimeSec: item.estimatedResponseTimeSec,
      cognitiveProcess: item.cognitiveProcess,
      scoringRule: item.scoringRule,
      version: item.version,
      formAssociationCount: item.formMappings.length,
      activeFormAssociationCount: item.formMappings.filter(
        (mapping) => mapping.status === 'ACTIVE',
      ).length,
      openPsychometricFlagCount: item.psychometricFlags.filter(
        (flag) => flag.status === 'OPEN',
      ).length,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  private async buildSessionLevelExportRows(
    request: AnalyticsExportRequestWithRelations,
  ): Promise<Record<string, unknown>[]> {
    const createdAt = this.buildDateRangeWhere(request);

    const sessions = await this.prisma.session.findMany({
      where: createdAt
        ? {
            createdAt,
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: sessionInclude,
    });

    return sessions.map((session) => ({
      sessionId: session.id,
      participantIdentifier:
        session.user?.email ?? session.user?.name ?? session.userId,
      status: session.status,
      campaignId: session.campaignId,
      campaignName: session.campaign?.name ?? null,
      invitationId: session.invitationId,
      assessmentFormId: session.assessmentFormId,
      assessmentFormName: session.assessmentForm.name,
      assessmentFormVersion: session.assessmentFormVersion,
      assessmentFormVersionLabel: session.assessmentFormVersionLabel,
      scoringVersion: session.scoringVersion,
      reportVersion: session.reportVersion,
      responseCount: session.responses.length,
      overallRawScore: session.score?.overallRawScore ?? null,
      overallMaxScore: session.score?.overallMaxScore ?? null,
      overallComposite: session.score?.overallComposite ?? null,
      overallBand: session.score?.overallBand ?? null,
      startedAt: session.startedAt?.toISOString() ?? null,
      completedAt: session.completedAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }));
  }

  private async buildResponseLevelExportRows(
    request: AnalyticsExportRequestWithRelations,
  ): Promise<Record<string, unknown>[]> {
    const createdAt = this.buildDateRangeWhere(request);

    const responses = await this.prisma.response.findMany({
      where: createdAt
        ? {
            createdAt,
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        item: true,
        session: {
          include: {
            user: true,
            assessmentForm: true,
            campaign: true,
          },
        },
      },
    });

    return responses.map((response) => ({
      responseId: response.id,
      sessionId: response.sessionId,
      participantIdentifier:
        response.session.user?.email ??
        response.session.user?.name ??
        response.session.userId,
      campaignId: response.session.campaignId,
      campaignName: response.session.campaign?.name ?? null,
      assessmentFormId: response.session.assessmentFormId,
      assessmentFormName: response.session.assessmentForm.name,
      itemId: response.itemId,
      itemDomain: response.item.domain,
      itemStatus: response.item.status,
      answer: this.stringifyExportValue(response.answer),
      correctAnswer: this.stringifyExportValue(response.item.correctAnswer),
      submittedAt: response.submittedAt?.toISOString() ?? null,
      createdAt: response.createdAt.toISOString(),
      updatedAt: response.updatedAt.toISOString(),
    }));
  }

  private async buildScoreLevelExportRows(
    request: AnalyticsExportRequestWithRelations,
  ): Promise<Record<string, unknown>[]> {
    const createdAt = this.buildDateRangeWhere(request);

    const scores = await this.prisma.score.findMany({
      where: createdAt
        ? {
            createdAt,
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        session: {
          include: {
            user: true,
            assessmentForm: true,
            campaign: true,
          },
        },
      },
    });

    return scores.map((score) => ({
      scoreId: score.id,
      sessionId: score.sessionId,
      participantIdentifier:
        score.session.user?.email ??
        score.session.user?.name ??
        score.session.userId,
      campaignId: score.session.campaignId,
      campaignName: score.session.campaign?.name ?? null,
      assessmentFormId: score.session.assessmentFormId,
      assessmentFormName: score.session.assessmentForm.name,
      abstractRawScore: score.abstractRawScore,
      abstractMaxScore: score.abstractMaxScore,
      numericalRawScore: score.numericalRawScore,
      numericalMaxScore: score.numericalMaxScore,
      overallRawScore: score.overallRawScore,
      overallMaxScore: score.overallMaxScore,
      overallComposite: score.overallComposite,
      abstractBand: score.abstractBand,
      numericalBand: score.numericalBand,
      overallBand: score.overallBand,
      domainScores: this.stringifyExportValue(score.domainScores),
      scoringMetadata: this.stringifyExportValue(score.scoringMetadata),
      scoringVersion: score.scoringVersion,
      createdAt: score.createdAt.toISOString(),
      updatedAt: score.updatedAt.toISOString(),
    }));
  }

  private async buildCampaignSummaryExportRows(
    request: AnalyticsExportRequestWithRelations,
  ): Promise<Record<string, unknown>[]> {
    const createdAt = this.buildDateRangeWhere(request);

    const campaigns = await this.prisma.campaign.findMany({
      where: createdAt
        ? {
            createdAt,
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        organisation: true,
        assessmentForm: true,
        invitations: true,
        sessions: {
          include: {
            score: true,
          },
        },
      },
    });

    return campaigns.map((campaign) => {
      const completedSessions = campaign.sessions.filter(
        (session) => session.status === 'COMPLETED',
      );

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignStatus: campaign.status,
        organisationId: campaign.organisationId,
        organisationName: campaign.organisation.name,
        assessmentFormId: campaign.assessmentFormId,
        assessmentFormName: campaign.assessmentForm?.name ?? null,
        invitationCount: campaign.invitations.length,
        acceptedInvitationCount: campaign.invitations.filter(
          (invitation) => invitation.status === 'ACCEPTED',
        ).length,
        sessionCount: campaign.sessions.length,
        completedSessionCount: completedSessions.length,
        completionRate:
          campaign.sessions.length === 0
            ? 0
            : completedSessions.length / campaign.sessions.length,
        averageOverallComposite:
          completedSessions.length === 0
            ? null
            : completedSessions.reduce(
                (sum, session) => sum + (session.score?.overallComposite ?? 0),
                0,
              ) / completedSessions.length,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      };
    });
  }

  private stringifyExportValue(value: unknown) {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  }
  private toCsv(rows: Record<string, unknown>[]) {
    const firstRow = rows.at(0);

    if (!firstRow) {
      return '';
    }

    const headers = Object.keys(firstRow);

    return [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((header) => this.escapeCsvCell(row[header])).join(','),
      ),
    ].join('\n');
  }
  private escapeCsvCell(value: unknown) {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue =
      typeof value === 'string' ? value : this.stringifyExportValue(value);

    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      return `"${stringValue.replaceAll('"', '""')}"`;
    }

    return stringValue;
  }

  private parseOptionalDate(value?: string | null) {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Invalid date value: ${value}`);
    }

    return parsedDate;
  }

  private toInternalAnalyticsExportRequestOutput(
    request: AnalyticsExportRequestWithRelations,
  ): InternalAnalyticsExportRequestOutput {
    return {
      id: request.id,
      dataset: request.dataset,
      format: request.format,
      status: request.status,
      dateFrom: request.dateFrom?.toISOString() ?? null,
      dateTo: request.dateTo?.toISOString() ?? null,
      scope: request.scope,
      requestedById: request.requestedById,
      requestedBy:
        request.requestedBy?.name ??
        request.requestedBy?.email ??
        request.requestedRole ??
        'Internal user',
      requestedRole: request.requestedRole,
      requestReason: request.requestReason,
      reviewedById: request.reviewedById,
      reviewedBy: request.reviewedBy?.name ?? request.reviewedBy?.email ?? null,
      reviewedAt: request.reviewedAt?.toISOString() ?? null,
      reviewDecision: request.reviewDecision,
      reviewReason: request.reviewReason,
      generatedAt: request.generatedAt?.toISOString() ?? null,
      fileKey: request.fileKey,
      failureReason: request.failureReason,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }

  private getItemStatusAuditAction(status: ItemStatus) {
    if (status === ItemStatus.ACTIVE) {
      return 'ITEM_ACTIVATED';
    }

    if (status === ItemStatus.RETIRED) {
      return 'ITEM_RETIRED';
    }

    if (status === ItemStatus.UNDER_REVIEW) {
      return 'ITEM_MARKED_UNDER_REVIEW';
    }

    return 'ITEM_RETURNED_TO_DRAFT';
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
        report.session.applicantName ??
        report.session.user?.name ??
        report.session.applicantEmail ??
        report.session.user?.email ??
        report.session.userId ??
        report.session.id,
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
        session.applicantName ??
        session.user?.name ??
        session.applicantEmail ??
        session.user?.email ??
        session.userId ??
        session.id,
      sessionType: session.campaignId ? 'EMPLOYER_LINKED' : 'CONSUMER',
      formId: session.assessmentFormId,
      formLabel: session.assessmentForm.name,
      formVersion: session.assessmentFormVersion,
      formVersionLabel: session.assessmentFormVersionLabel,
      scoringVersion: session.scoringVersion,
      reportVersion: session.reportVersion,
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

    const latestPsychometricMetric = item.psychometricMetrics[0] ?? null;

    return {
      id: item.id,
      label: `${item.domain} ${item.itemType}`,
      domain: item.domain,
      subdomain: item.subdomain,
      itemFamily: item.itemFamily,
      itemType: item.itemType,
      stimulusType: item.stimulusType,
      prompt: item.prompt,
      options: item.options,
      correctAnswer: item.correctAnswer,
      scoringRule: item.scoringRule,
      difficulty: item.difficulty,
      intendedDifficulty: item.intendedDifficulty,
      estimatedResponseTimeSec: item.estimatedResponseTimeSec,
      cognitiveProcess: item.cognitiveProcess,
      itemRationale: item.itemRationale,
      distractorRationale: item.distractorRationale,
      reviewStatus: item.reviewStatus,
      psychometricStatus: item.psychometricStatus,
      lastReviewedAt: item.lastReviewedAt?.toISOString() ?? null,
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
      empiricalDifficulty: latestPsychometricMetric?.proportionCorrect ?? null,
      psychometricFlags: item.psychometricFlags.map((flag) => ({
        id: flag.id,
        flagType: flag.flagType,
        severity: flag.severity,
        status: flag.status,
        message: flag.message,
        createdAt: flag.createdAt.toISOString(),
      })),
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

  private normaliseNullableString(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length === 0 ? null : trimmed;
  }

  private parsePilotFormStatus(value: string) {
    if (Object.values(PilotFormStatus).includes(value as PilotFormStatus)) {
      return value as PilotFormStatus;
    }

    throw new BadRequestException(`Unsupported pilot form status: ${value}`);
  }

  private parseAssessmentDomain(value: string) {
    if (Object.values(AssessmentDomain).includes(value as AssessmentDomain)) {
      return value as AssessmentDomain;
    }

    throw new BadRequestException(`Unsupported assessment domain: ${value}`);
  }

  private parseAssessmentSectionType(value: string) {
    if (
      Object.values(AssessmentSectionType).includes(
        value as AssessmentSectionType,
      )
    ) {
      return value as AssessmentSectionType;
    }

    throw new BadRequestException(
      `Unsupported assessment section type: ${value}`,
    );
  }

  private toInputJsonValue(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private parseIntendedDifficulty(
    value: string | null | undefined,
  ): ItemIntendedDifficulty | null | undefined {
    const normalised = this.normaliseNullableString(value);

    if (normalised === undefined || normalised === null) {
      return normalised;
    }

    if (
      !Object.values(ItemIntendedDifficulty).includes(
        normalised as ItemIntendedDifficulty,
      )
    ) {
      throw new BadRequestException('Unsupported intended difficulty.');
    }

    return normalised as ItemIntendedDifficulty;
  }

  private parseItemReviewStatus(
    value: string | null | undefined,
  ): ItemReviewStatus | undefined {
    const normalised = this.normaliseNullableString(value);

    if (normalised === undefined) {
      return undefined;
    }

    if (normalised === null) {
      throw new BadRequestException('Review status cannot be empty.');
    }

    if (
      !Object.values(ItemReviewStatus).includes(normalised as ItemReviewStatus)
    ) {
      throw new BadRequestException('Unsupported item review status.');
    }

    return normalised as ItemReviewStatus;
  }

  private parsePsychometricItemStatus(
    value: string | null | undefined,
  ): PsychometricItemStatus | undefined {
    const normalised = this.normaliseNullableString(value);

    if (normalised === undefined) {
      return undefined;
    }

    if (normalised === null) {
      throw new BadRequestException(
        'Psychometric item status cannot be empty.',
      );
    }

    if (
      !Object.values(PsychometricItemStatus).includes(
        normalised as PsychometricItemStatus,
      )
    ) {
      throw new BadRequestException('Unsupported psychometric item status.');
    }

    return normalised as PsychometricItemStatus;
  }

  private hasUsableJsonValue(value: unknown) {
    if (value === null || value === undefined) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>).length > 0;
    }

    return true;
  }

  private assertPilotReadyItemMetadata(item: {
    domain: AssessmentDomain;
    subdomain: string | null;
    itemFamily: string | null;
    intendedDifficulty: ItemIntendedDifficulty | null;
    estimatedResponseTimeSec: number | null;
    correctAnswer: unknown;
    options: unknown;
    itemRationale: string | null;
    scoringRule: string | null;
    reviewStatus: ItemReviewStatus;
    psychometricStatus: PsychometricItemStatus;
  }) {
    const missingFields: string[] = [];

    if (!item.domain) {
      missingFields.push('domain');
    }

    if (!item.subdomain || item.subdomain.trim().length === 0) {
      missingFields.push('subdomain');
    }

    if (!item.itemFamily || item.itemFamily.trim().length === 0) {
      missingFields.push('itemFamily');
    }

    if (!item.intendedDifficulty) {
      missingFields.push('intendedDifficulty');
    }

    if (
      item.estimatedResponseTimeSec === null ||
      item.estimatedResponseTimeSec === undefined ||
      item.estimatedResponseTimeSec <= 0
    ) {
      missingFields.push('estimatedResponseTimeSec');
    }

    if (!this.hasUsableJsonValue(item.correctAnswer)) {
      missingFields.push('correctAnswer');
    }

    if (!this.hasUsableJsonValue(item.options)) {
      missingFields.push('options');
    }

    if (!item.itemRationale || item.itemRationale.trim().length === 0) {
      missingFields.push('itemRationale');
    }

    if (!item.scoringRule || item.scoringRule.trim().length === 0) {
      missingFields.push('scoringRule');
    }

    if (item.reviewStatus !== ItemReviewStatus.APPROVED_FOR_PILOT) {
      missingFields.push('reviewStatus must be APPROVED_FOR_PILOT');
    }

    if (item.psychometricStatus !== PsychometricItemStatus.PILOT_READY) {
      missingFields.push('psychometricStatus must be PILOT_READY');
    }

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Item cannot be marked pilot-ready until required metadata is complete: ${missingFields.join(
          ', ',
        )}.`,
      );
    }
  }
  private isLockedPilotStatus(status: PilotFormStatus) {
    return LOCKED_FORM_STATUSES.includes(
      status as (typeof LOCKED_FORM_STATUSES)[number],
    );
  }

  private isLockedPilotForm(form: {
    isLocked: boolean;
    pilotStatus: PilotFormStatus;
  }) {
    return form.isLocked || this.isLockedPilotStatus(form.pilotStatus);
  }

  private assertLockedFormOverrideAllowed({
    actorRole,
    overrideReason,
    operation,
  }: {
    actorRole: InternalApiRole;
    overrideReason?: string | null;
    operation: string;
  }) {
    if (actorRole !== 'PLATFORM_ADMIN') {
      throw new BadRequestException(
        `Only platform admins can override locked pilot form governance when ${operation}.`,
      );
    }

    if (!overrideReason || overrideReason.trim().length < 10) {
      throw new BadRequestException(
        `An override reason of at least 10 characters is required when ${operation}.`,
      );
    }
  }

  private buildPilotBlueprintValidation(
    form: PilotFormWithInternalRelations,
  ): InternalPilotFormBlueprintValidationOutput {
    const expectedBlueprint = this.getFormBlueprint(form);

    const actualBlueprint = Object.fromEntries(
      Object.keys(expectedBlueprint).map((domain) => [domain, 0]),
    ) as Record<string, number>;

    const errors: string[] = [];
    const warnings: string[] = [];

    const activeMappings = form.items.filter(
      (mapping) => mapping.status === 'ACTIVE',
    );

    for (const mapping of activeMappings) {
      const domain = mapping.item.domain;

      actualBlueprint[domain] = (actualBlueprint[domain] ?? 0) + 1;

      if (
        mapping.item.psychometricStatus !== PsychometricItemStatus.PILOT_READY
      ) {
        errors.push(
          `Item ${mapping.itemId} is not pilot-ready (${mapping.item.psychometricStatus}).`,
        );
      }

      if (mapping.item.reviewStatus !== ItemReviewStatus.APPROVED_FOR_PILOT) {
        errors.push(
          `Item ${mapping.itemId} is not content-approved for pilot (${mapping.item.reviewStatus}).`,
        );
      }
    }

    for (const [domain, expectedCount] of Object.entries(expectedBlueprint)) {
      const actualCount = actualBlueprint[domain] ?? 0;

      if (expectedCount > 0 && actualCount === 0) {
        errors.push(`Pilot form is missing ${domain}.`);
      }

      if (actualCount < expectedCount) {
        errors.push(
          `${domain} is underrepresented: expected ${expectedCount}, found ${actualCount}.`,
        );
      }

      if (actualCount > expectedCount) {
        warnings.push(
          `${domain} is overrepresented: expected ${expectedCount}, found ${actualCount}.`,
        );
      }
    }

    for (const [domain, actualCount] of Object.entries(actualBlueprint)) {
      if (expectedBlueprint[domain] === undefined && actualCount > 0) {
        warnings.push(
          `${domain} is not part of this form blueprint but has ${actualCount} active item(s).`,
        );
      }
    }

    const totalExpectedItems = Object.values(expectedBlueprint).reduce(
      (sum, count) => sum + count,
      0,
    );

    const totalActualItems = Object.values(actualBlueprint).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      formId: form.id,
      formLabel: form.name,
      formVersion: form.version,
      formVersionLabel: form.versionLabel,
      expectedBlueprint,
      actualBlueprint,
      totalExpectedItems,
      totalActualItems,
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private getFormBlueprint(
    form: Pick<PilotFormWithInternalRelations, 'domainBlueprint'>,
  ): Record<string, number> {
    if (
      !form.domainBlueprint ||
      typeof form.domainBlueprint !== 'object' ||
      Array.isArray(form.domainBlueprint)
    ) {
      return { ...PILOT_BLUEPRINT };
    }

    const blueprint: Record<string, number> = {};

    for (const [domain, value] of Object.entries(form.domainBlueprint)) {
      const parsedValue = typeof value === 'number' ? value : Number(value);

      if (Number.isFinite(parsedValue) && parsedValue >= 0) {
        blueprint[domain] = parsedValue;
      }
    }

    if (Object.keys(blueprint).length === 0) {
      return { ...PILOT_BLUEPRINT };
    }

    return blueprint;
  }

  private toInternalPilotFormOutput(
    form: PilotFormWithInternalRelations,
  ): InternalPilotFormOutput {
    const activeItems = form.items.filter(
      (mapping) => mapping.status === FormItemMappingStatus.ACTIVE,
    );

    return {
      id: form.id,
      name: form.name,
      version: form.version,
      versionLabel: form.versionLabel,
      isActive: form.isActive,
      pilotStatus: form.pilotStatus,
      isLocked: form.isLocked,
      domainBlueprint: form.domainBlueprint,
      timingRules: form.timingRules,
      scoringVersion: form.scoringVersion,
      reportVersion: form.reportVersion,
      lockedAt: form.lockedAt?.toISOString() ?? null,
      lockedBy: form.lockedBy,
      createdAt: form.createdAt.toISOString(),
      updatedAt: form.updatedAt.toISOString(),
      sectionCount: form.sections.length,
      itemCount: form.items.length,
      activeItemCount: activeItems.length,
      sections: form.sections.map((section) => ({
        id: section.id,
        type: section.type,
        domain: section.domain,
        title: section.title,
        timeLimitSec: section.timeLimitSec,
        orderIndex: section.orderIndex,
      })),
      blueprintValidation: this.buildPilotBlueprintValidation(form),
    };
  }
  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
