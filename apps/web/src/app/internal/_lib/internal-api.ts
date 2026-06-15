import { auth } from '@/auth';

export type InternalSessionType = 'EMPLOYER_LINKED' | 'CONSUMER';

export type InternalCompletionStatus = 'NOT_STARTED' | 'PARTIAL' | 'COMPLETE';

export type SuspiciousFlagStatus = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type ActivateInternalItemInput = {
  note?: string | null;
};

export type CreateAnalyticsExportRequestInput = {
  dataset: AnalyticsExportDataset;
  dateFrom?: string | null;
  dateTo?: string | null;
  format?: 'CSV' | 'JSON' | null;
  scope?: unknown;
  requestReason?: string | null;
};

export type InternalAnalyticsExportFileOutput = {
  fileName: string;
  contentType: string;
  content: string;
};

export type InternalAnalyticsExportGovernanceSettingOutput = {
  approvalRequired: boolean;
  updatedByRole: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAnalyticsExportGovernanceSettingInput = {
  approvalRequired?: boolean;
};

export type ReviewAnalyticsExportRequestInput = {
  decision: 'APPROVED' | 'DECLINED';
  reviewReason?: string | null;
};

export type GenerateAnalyticsExportRequestInput = {
  generationReason?: string | null;
};
export type InternalAnalyticsExportRequestStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'DECLINED'
  | 'GENERATING'
  | 'GENERATED'
  | 'FAILED'
  | 'CANCELLED';

export type InternalAnalyticsExportRequestOutput = {
  id: string;
  dataset: string;
  format: string;
  status: InternalAnalyticsExportRequestStatus;
  dateFrom: string | null;
  dateTo: string | null;
  scope: unknown;
  requestedById: string | null;
  requestedBy: string;
  requestedRole: string | null;
  requestReason: string | null;
  reviewedById: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewDecision: string | null;
  reviewReason: string | null;
  generatedAt: string | null;
  fileKey: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateInternalDraftItemInput = {
  domain?: string;
  itemType?: string;
  prompt?: string;
  options?: unknown;
  correctAnswer?: unknown;
  difficulty?: string | null;
  subdomain?: string | null;
  itemFamily?: string | null;
  stimulusType?: string | null;
  intendedDifficulty?: string | null;
  estimatedResponseTimeSec?: number | null;
  cognitiveProcess?: string | null;
  itemRationale?: string | null;
  distractorRationale?: unknown;
  scoringRule?: string | null;
  reviewStatus?: string | null;
  psychometricStatus?: string | null;
  note?: string | null;
  overrideReason?: string | null;
};

export type UpdateInternalItemReviewReadinessInput = {
  reviewStatus: string;
  psychometricStatus: string;
  note?: string | null;
};

export type UpdateInternalItemStatusInput = {
  status: 'DRAFT' | 'UNDER_REVIEW' | 'ACTIVE' | 'RETIRED';
  note?: string | null;
};
export type SuspiciousSessionIndicator =
  | 'UNUSUALLY_SHORT_COMPLETION_TIME'
  | 'REPEATED_REFRESH_RECONNECT'
  | 'ABNORMAL_RESPONSE_TIMING'
  | 'DUPLICATE_ACCESS_ANOMALY'
  | 'INCONSISTENT_SUBMISSION_PATTERN'
  | 'EXTREME_OMISSION_BEHAVIOUR';

export type InternalSessionOutput = {
  sessionId: string;
  participantIdentifier: string;
  sessionType: InternalSessionType;
  formId: string;
  formLabel: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  completionStatus: InternalCompletionStatus;
  overallBand: string | null;
  completionTimeMinutes: number | null;
  refreshReconnectEvents: number;
  omissionRate: number;
  duplicateAccessAttempts: number;
  inconsistentSubmissionEvents: number;
  compressedTimingEvents: number;
  interruptionHistory: string[];
  responsePatternSummary: string;
  scoringOutcome: string;
  reviewerNotes: string[];
  suspiciousFlagStatus: SuspiciousFlagStatus;
  suspiciousIndicators: SuspiciousSessionIndicator[];
  suspiciousFlagReasons: string[];
};

export type CreateInternalItemFormMappingInput = {
  formId: string;
  sectionId?: string | null;
  orderIndex?: number | null;
  status?: string;
  overrideReason?: string | null;
};

export type AnalyticsExportDataset =
  | 'ITEM_LEVEL'
  | 'SESSION_LEVEL'
  | 'RESPONSE_LEVEL'
  | 'SCORE_LEVEL'
  | 'CAMPAIGN_SUMMARY';

export type CreateInternalDraftItemInput = {
  id?: string;
  domain: string;
  subdomain?: string | null;
  itemFamily?: string | null;
  itemType: string;
  stimulusType?: string | null;
  prompt: string;
  options: unknown;
  correctAnswer: unknown;
  scoringRule?: string | null;
  difficulty: string | null;
  intendedDifficulty?: string | null;
  estimatedResponseTimeSec?: number | null;
  cognitiveProcess?: string | null;
  itemRationale?: string | null;
  distractorRationale?: unknown;
  reviewStatus?: string | null;
  psychometricStatus?: string | null;
  distractorRationaleLegacy?: string | null;
  timeExpectationSeconds?: number | null;
  explanationNotes?: string | null;
  assetLinkage?: string | null;
};

export type AnalyticsExportDefinition = {
  dataset: AnalyticsExportDataset;
  label: string;
  description: string;
  format: 'CSV' | 'JSON';
  currentlyAvailable: boolean;
};

export type InternalAuditEvent = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  actor: string;
  actorUserId: string | null;
  metadata: unknown;
  createdAt: string;
};

export const sessionTypeLabels: Record<InternalSessionType, string> = {
  EMPLOYER_LINKED: 'Employer-linked',
  CONSUMER: 'Consumer',
};

export type ScoreDistributionBucket = {
  label: string;
  count: number;
};

export type InternalSectionPerformanceSummary = {
  section: string;
  sectionLabel: string;
  startedSessions: number;
  completedSessions: number;
  completionRate: number;
  averageScorePercent: number;
  averageCompletionTimeMinutes: number | null;
  scoreDistribution: ScoreDistributionBucket[];
};

export type InternalFormPerformanceSummary = {
  formId: string;
  formLabel: string;
  startedSessions: number;
  completedSessions: number;
  completionRate: number;
  averageCompletionTimeMinutes: number | null;
  scoreSpread: ScoreDistributionBucket[];
};

export type CreateInternalAssessmentFormInput = {
  name: string;
  version?: number | null;
  versionLabel?: string | null;
  isActive?: boolean | null;
  pilotStatus?: string | null;
  domainBlueprint?: unknown;
  timingRules?: unknown;
  scoringVersion?: number | null;
  reportVersion?: number | null;
  createStandardSections?: boolean | null;
};

export type InternalPilotFormBlueprintValidationOutput = {
  formId: string;
  formLabel: string;
  formVersion: number;
  formVersionLabel: string | null;
  expectedBlueprint: Record<string, number>;
  actualBlueprint: Record<string, number>;
  totalExpectedItems: number;
  totalActualItems: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export type InternalPilotFormSectionOutput = {
  id: string;
  type: string;
  domain: string;
  title: string;
  timeLimitSec: number;
  orderIndex: number;
};

export type InternalPilotFormOutput = {
  id: string;
  name: string;
  version: number;
  versionLabel: string | null;
  isActive: boolean;
  pilotStatus: string;
  isLocked: boolean;
  domainBlueprint: unknown;
  timingRules: unknown;
  scoringVersion: number;
  reportVersion: number;
  lockedAt: string | null;
  lockedBy: string | null;
  createdAt: string;
  updatedAt: string;
  sectionCount: number;
  itemCount: number;
  activeItemCount: number;
  sections: InternalPilotFormSectionOutput[];
  blueprintValidation: InternalPilotFormBlueprintValidationOutput;
};

export type UpdatePilotFormStatusInput = {
  status: string;
  overrideReason?: string | null;
};

export const pilotFormStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  READY_FOR_REVIEW: 'Ready for review',
  LOCKED_FOR_PILOT: 'Locked for pilot',
  ACTIVE_PILOT: 'Active pilot',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

export type InternalResearcherDashboardOverview = {
  totalItemsByStatus: Record<string, number>;
  activeItemsByDomain: {
    domain: string;
    label: string;
    count: number;
  }[];
  formsInUse: number;
  recentSessionVolume: number;
  flaggedSessionCount: number;
  averageSectionCompletionTime: number | null;
  itemsNeedingReview: {
    id: string;
    label: string;
    domain: string;
    status: string;
    reason: string;
  }[];
};

export type InternalAdminOverview = {
  organisationCount: number;
  activeCampaigns: number;
  userCountsByRole: Record<string, number>;
  recentAuditActivity: InternalAuditEvent[];
  platformErrors: InternalAuditEvent[];
  exportEvents: InternalAuditEvent[];
  itemLifecycleEvents: InternalAuditEvent[];
  exportRequestCounts: {
    total: number;
    requested: number;
    approved: number;
    declined: number;
    generating: number;
    generated: number;
    failed: number;
    cancelled: number;
  };
  pendingExportRequests: InternalAnalyticsExportRequestOutput[];
};

export const itemDomainLabels: Record<string, string> = {
  VERBAL_REASONING: 'Verbal reasoning',
  NUMERICAL_REASONING: 'Numerical reasoning',
  ABSTRACT_REASONING: 'Abstract reasoning',
  LOGICAL_REASONING: 'Logical reasoning',
  ANALYTICAL_PROBLEM_SOLVING: 'Analytical problem-solving',

  ABSTRACT: 'Abstract reasoning',
  NUMERICAL: 'Numerical reasoning',
  VERBAL: 'Verbal reasoning',
};
export const itemStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  RETIRED: 'Retired',
  UNDER_REVIEW: 'Under review',
};

export const itemIntendedDifficultyLabels: Record<string, string> = {
  EASY: 'Easy',
  MODERATE: 'Moderate',
  HARD: 'Hard',
  VERY_HARD: 'Very hard',
};

export const itemReviewStatusLabels: Record<string, string> = {
  NOT_REVIEWED: 'Not reviewed',
  REVIEW_IN_PROGRESS: 'Review in progress',
  APPROVED_FOR_PILOT: 'Approved for pilot',
  NEEDS_REVISION: 'Needs revision',
  REJECTED: 'Rejected',
};

export const psychometricItemStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  CONTENT_REVIEWED: 'Content reviewed',
  PILOT_READY: 'Pilot ready',
  UNDER_REVIEW: 'Under review',
  FLAGGED_AFTER_PILOT: 'Flagged after pilot',
  RETIRED: 'Retired',
  CALIBRATED: 'Calibrated',
};

export function formatCorrectRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

export function fetchAnalyticsExportGovernanceSetting() {
  return fetchInternalApi<InternalAnalyticsExportGovernanceSettingOutput>({
    path: '/internal/exports/governance',
  });
}

export function updateAnalyticsExportGovernanceSetting(
  input: UpdateAnalyticsExportGovernanceSettingInput
) {
  return writeInternalApi<InternalAnalyticsExportGovernanceSettingOutput>({
    path: '/internal/api/exports/governance',
    method: 'PATCH',
    body: input,
  });
}

export function formatJsonValue(value: unknown) {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

export const completionStatusLabels: Record<InternalCompletionStatus, string> =
  {
    NOT_STARTED: 'Not started',
    PARTIAL: 'Partial',
    COMPLETE: 'Complete',
  };

export const suspiciousFlagStatusLabels: Record<SuspiciousFlagStatus, string> =
  {
    NONE: 'None',
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
  };

export const suspiciousSessionIndicatorLabels: Record<
  SuspiciousSessionIndicator,
  string
> = {
  UNUSUALLY_SHORT_COMPLETION_TIME: 'Unusually short completion time',
  REPEATED_REFRESH_RECONNECT: 'Repeated refresh/reconnect events',
  ABNORMAL_RESPONSE_TIMING: 'Abnormal response timing patterns',
  DUPLICATE_ACCESS_ANOMALY: 'Duplicate or repeated access anomaly',
  INCONSISTENT_SUBMISSION_PATTERN: 'Inconsistent submission pattern',
  EXTREME_OMISSION_BEHAVIOUR: 'Extreme omission behaviour',
};

export function formatInternalDuration(minutes: number | null) {
  if (minutes === null) {
    return 'In progress';
  }

  return `${minutes} min`;
}

export function formatInternalRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

export function formatOmissionRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

function getInternalApiBaseUrl() {
  return process.env.INTERNAL_API_BASE_URL ?? 'http://localhost:3001';
}

async function fetchInternalApi<T>({
  path,
  accessToken,
}: {
  path: string;
  accessToken?: string;
}): Promise<T> {
  const url = `${getInternalApiBaseUrl()}${path}`;
  const session = accessToken ? null : await auth();
  const resolvedAccessToken = accessToken ?? session?.accessToken;
  const response = await fetch(url, {
    cache: 'no-store',
    headers: resolvedAccessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  if (!response.ok) {
    let details = '';

    try {
      const body = (await response.json()) as {
        message?: string;
        error?: string;
        statusCode?: number;
      };

      details = body.message
        ? ` ${body.message}`
        : body.error
          ? ` ${body.error}`
          : '';
    } catch {
      details = '';
    }

    throw new Error(
      `Internal API request failed for ${path}: ${response.status} ${response.statusText}.${details}`
    );
  }

  return response.json() as Promise<T>;
}

async function writeInternalApi<T>({
  path,
  method,
  body,
}: {
  path: string;
  method: 'POST' | 'PATCH';
  body: unknown;
}): Promise<T> {
  const url =
    typeof window === 'undefined' ? `${getInternalApiBaseUrl()}${path}` : path;
  const session = await auth();
  const resolvedAccessToken = session?.accessToken;
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resolvedAccessToken}`,
    },

    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let details = '';

    try {
      const responseBody = (await response.json()) as {
        message?: string;
        error?: string;
      };

      details = responseBody.message
        ? ` ${responseBody.message}`
        : responseBody.error
          ? ` ${responseBody.error}`
          : '';
    } catch {
      details = '';
    }

    throw new Error(
      `Internal API write failed for ${path}: ${response.status} ${response.statusText}.${details}`
    );
  }

  return response.json() as Promise<T>;
}

export function fetchInternalSessions() {
  return fetchInternalApi<InternalSessionOutput[]>({
    path: '/internal/sessions',
  });
}

export function fetchSuspiciousInternalSessions() {
  return fetchInternalApi<InternalSessionOutput[]>({
    path: '/internal/sessions/suspicious',
  });
}

export function fetchInternalSessionById(sessionId: string) {
  return fetchInternalApi<InternalSessionOutput>({
    path: `/internal/sessions/${encodeURIComponent(sessionId)}`,
  });
}

export function fetchInternalAuditEvents() {
  return fetchInternalApi<InternalAuditEvent[]>({
    path: '/internal/audit',
  });
}

export function requestAnalyticsExport(
  input: CreateAnalyticsExportRequestInput
) {
  return writeInternalApi<InternalAnalyticsExportRequestOutput>({
    path: '/internal/api/exports/requests',
    method: 'POST',
    body: input,
  });
}

export function fetchAnalyticsExportRequests() {
  return fetchInternalApi<InternalAnalyticsExportRequestOutput[]>({
    path: '/internal/exports/requests',
  });
}

export type DirectAnalyticsExportInput = {
  dataset: AnalyticsExportDataset;
  dateFrom?: string | null;
  dateTo?: string | null;
  format?: 'CSV' | 'JSON' | null;
  scope?: unknown;
  directReason?: string | null;
};

export function createDirectAnalyticsExport(input: DirectAnalyticsExportInput) {
  return writeInternalApi<InternalAnalyticsExportFileOutput>({
    path: '/internal/api/exports/direct',
    method: 'POST',
    body: input,
  });
}

export function generateAnalyticsExportRequest(
  requestId: string,
  input: GenerateAnalyticsExportRequestInput
) {
  return writeInternalApi<InternalAnalyticsExportRequestOutput>({
    path: `/internal/api/exports/requests/${encodeURIComponent(
      requestId
    )}/generate`,
    method: 'POST',
    body: input,
  });
}

export function reviewAnalyticsExportRequest(
  requestId: string,
  input: ReviewAnalyticsExportRequestInput
) {
  return writeInternalApi<InternalAnalyticsExportRequestOutput>({
    path: `/internal/api/exports/requests/${encodeURIComponent(
      requestId
    )}/review`,
    method: 'PATCH',
    body: input,
  });
}

export function fetchAnalyticsExportDefinitions() {
  return fetchInternalApi<AnalyticsExportDefinition[]>({
    path: '/internal/exports',
  });
}

export type InternalItemPerformanceOutput = {
  itemId: string;
  exposureCount: number;
  validResponses: number;
  correctResponseRate: number;
  omissionCount: number;
  averageResponseTimeSeconds: number | null;
  activeFormAssociations: number;
};

export type InternalItemTraceabilityOutput = {
  itemId: string;
  itemLabel: string;
  domain: string;
  status: string;
  totalExposureCount: number;
  totalValidResponses: number;
  totalCorrectResponses: number;
  totalOmissions: number;
  forms: {
    mappingId: string;
    formId: string;
    formLabel: string;
    sectionId: string | null;
    mappingStatus: string;
    orderIndex: number | null;
    exposureCount: number;
    validResponses: number;
    correctResponses: number;
    omissionCount: number;
    completedSessions: number;
    inProgressSessions: number;
  }[];
  linkedSessions: {
    sessionId: string;
    participantIdentifier: string;
    formId: string;
    formLabel: string;
    sessionStatus: string;
    startedAt: string | null;
    completedAt: string | null;
    answeredItem: boolean;
    answer: unknown;
    submittedAt: string | null;
    overallBand: string | null;
  }[];
};

export type InternalReportScoreAuditOutput = {
  reportId: string;
  sessionId: string;
  participantIdentifier: string;
  formId: string;
  formLabel: string;
  formVersion: string | null;
  scoringVersion: number | null;
  reportVersion: number;
  reportGenerationTimestamp: string;
  reportType: string;
  visibilityCategory: string;
  scoreId: string | null;
  scoreCreatedAt: string | null;
  scoreUpdatedAt: string | null;
  overallBand: string | null;
  overallRawScore: number | null;
  overallMaxScore: number | null;
  abstractBand: string | null;
  numericalBand: string | null;
};

export type InternalItemOutput = {
  id: string;
  label: string;
  domain: string;
  subdomain: string | null;
  itemFamily: string | null;
  itemType: string;
  stimulusType: string | null;
  prompt: string;
  options: unknown;
  correctAnswer: unknown;
  scoringRule: string | null;
  difficulty: string | null;
  intendedDifficulty: string | null;
  estimatedResponseTimeSec: number | null;
  cognitiveProcess: string | null;
  itemRationale: string | null;
  distractorRationale: unknown;
  reviewStatus: string;
  psychometricStatus: string;
  lastReviewedAt: string | null;
  status: string;
  version: number;
  active: boolean;
  historicallyActive: boolean;
  createdAt: string;
  updatedAt: string;
  formAssociationCount: number;
  activeFormAssociationCount: number;
  empiricalDifficulty: number | null;
  psychometricFlags: {
    id: string;
    flagType: string;
    severity: string;
    status: string;
    message: string;
    createdAt: string;
  }[];
  performance: InternalItemPerformanceOutput;
};

export type InternalItemDetailOutput = InternalItemOutput & {
  statusHistory: {
    id: string;
    action: string;
    actor: string;
    summary: string;
    occurredAt: string;
  }[];
  formAssociations: {
    id: string;
    formId: string;
    sectionId: string | null;
    status: string;
    orderIndex: number | null;
  }[];
  reviewNotes: string[];
};
export function fetchInternalItems() {
  return fetchInternalApi<InternalItemOutput[]>({
    path: '/internal/items',
  });
}

export function fetchInternalItemById(itemId: string) {
  return fetchInternalApi<InternalItemDetailOutput>({
    path: `/internal/items/${encodeURIComponent(itemId)}`,
  });
}

export function fetchInternalItemPerformance(itemId: string) {
  return fetchInternalApi<InternalItemPerformanceOutput>({
    path: `/internal/items/${encodeURIComponent(itemId)}/performance`,
  });
}

export function fetchSectionPerformanceSummaries() {
  return fetchInternalApi<InternalSectionPerformanceSummary[]>({
    path: '/internal/performance/sections',
  });
}

export function fetchFormPerformanceSummaries() {
  return fetchInternalApi<InternalFormPerformanceSummary[]>({
    path: '/internal/performance/forms',
  });
}

export function fetchResearcherDashboardOverview() {
  return fetchInternalApi<InternalResearcherDashboardOverview>({
    path: '/internal/researcher/dashboard',
  });
}

export function fetchAdminOverview() {
  return fetchInternalApi<InternalAdminOverview>({
    path: '/internal/admin/overview',
  });
}

export function fetchInternalItemTraceability(itemId: string) {
  return fetchInternalApi<InternalItemTraceabilityOutput>({
    path: `/internal/items/${encodeURIComponent(itemId)}/traceability`,
  });
}

export function fetchReportScoreAuditRecords() {
  return fetchInternalApi<InternalReportScoreAuditOutput[]>({
    path: '/internal/reports/score-audit',
  });
}
export function createInternalDraftItem(input: CreateInternalDraftItemInput) {
  return writeInternalApi<InternalItemDetailOutput>({
    path: '/internal/api/items',
    method: 'POST',
    body: input,
  });
}

export function attachInternalItemToForm({
  itemId,
  input,
}: {
  itemId: string;
  input: CreateInternalItemFormMappingInput;
}) {
  return writeInternalApi<InternalItemTraceabilityOutput>({
    path: `/internal/api/items/${encodeURIComponent(itemId)}/form-mappings`,
    method: 'POST',
    body: input,
  });
}

export function activateInternalItem({
  itemId,
  input,
}: {
  itemId: string;
  input: ActivateInternalItemInput;
}) {
  return writeInternalApi<InternalItemDetailOutput>({
    path: `/internal/api/items/${encodeURIComponent(itemId)}/activate`,
    method: 'POST',
    body: input,
  });
}

export function updateInternalItemStatus({
  itemId,
  input,
}: {
  itemId: string;
  input: UpdateInternalItemStatusInput;
}) {
  return writeInternalApi<InternalItemDetailOutput>({
    path: `/internal/api/items/${encodeURIComponent(itemId)}/status`,
    method: 'POST',
    body: input,
  });
}

export function updateInternalItemReviewReadiness({
  itemId,
  input,
}: {
  itemId: string;
  input: UpdateInternalItemReviewReadinessInput;
}) {
  return writeInternalApi<InternalItemDetailOutput>({
    path: `/internal/api/items/${encodeURIComponent(itemId)}`,
    method: 'PATCH',
    body: input,
  });
}

export function updateInternalDraftItem({
  itemId,
  input,
}: {
  itemId: string;
  input: UpdateInternalDraftItemInput;
}) {
  return writeInternalApi<InternalItemDetailOutput>({
    path: `/internal/api/items/${encodeURIComponent(itemId)}`,
    method: 'PATCH',
    body: input,
  });
}

export function fetchInternalAssessmentForms() {
  return fetchInternalApi<InternalPilotFormOutput[]>({
    path: '/internal/forms',
  });
}

export function createInternalAssessmentForm(
  input: CreateInternalAssessmentFormInput
) {
  return writeInternalApi<InternalPilotFormOutput>({
    path: '/internal/api/forms',
    method: 'POST',
    body: input,
  });
}

export function fetchInternalPilotForms() {
  return fetchInternalApi<InternalPilotFormOutput[]>({
    path: '/internal/pilot-forms',
  });
}

export function fetchInternalPilotFormById(formId: string) {
  return fetchInternalApi<InternalPilotFormOutput>({
    path: `/internal/pilot-forms/${encodeURIComponent(formId)}`,
  });
}

export function fetchPilotFormBlueprintValidation(formId: string) {
  return fetchInternalApi<InternalPilotFormBlueprintValidationOutput>({
    path: `/internal/pilot-forms/${encodeURIComponent(
      formId
    )}/blueprint-validation`,
  });
}

export function createFormalPilotForm() {
  return writeInternalApi<InternalPilotFormOutput>({
    path: '/internal/api/pilot-forms/general-cognitive-ability-v0-1',
    method: 'POST',
    body: {},
  });
}

export function updatePilotFormStatus({
  formId,
  input,
}: {
  formId: string;
  input: UpdatePilotFormStatusInput;
}) {
  return writeInternalApi<InternalPilotFormOutput>({
    path: `/internal/api/pilot-forms/${encodeURIComponent(formId)}/status`,
    method: 'PATCH',
    body: input,
  });
}
