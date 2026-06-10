export type InternalSessionType = 'EMPLOYER_LINKED' | 'CONSUMER';

export type InternalCompletionStatus = 'NOT_STARTED' | 'PARTIAL' | 'COMPLETE';

export type SuspiciousFlagStatus = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type ActivateInternalItemInput = {
  note?: string | null;
};

export type UpdateInternalDraftItemInput = {
  domain?: string;
  itemType?: string;
  prompt?: string;
  options?: unknown;
  correctAnswer?: unknown;
  difficulty?: string | null;
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
  itemType: string;
  prompt: string;
  options: unknown;
  correctAnswer: unknown;
  difficulty: string | null;
  distractorRationale?: string | null;
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
};
export const itemDomainLabels: Record<string, string> = {
  ABSTRACT: 'Abstract reasoning',
  NUMERICAL: 'Numerical reasoning',
  VERBAL: 'Verbal reasoning',
  SPATIAL: 'Spatial reasoning',
  WORKING_MEMORY: 'Working memory',
};

export const itemStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  RETIRED: 'Retired',
  UNDER_REVIEW: 'Under review',
};

export function formatCorrectRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
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
  role = 'PLATFORM_ADMIN',
}: {
  path: string;
  role?: 'PLATFORM_ADMIN' | 'RESEARCHER';
}): Promise<T> {
  const url = `${getInternalApiBaseUrl()}${path}`;

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'x-internal-role': role,
    },
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
  role = 'RESEARCHER',
}: {
  path: string;
  method: 'POST' | 'PATCH';
  body: unknown;
  role?: 'PLATFORM_ADMIN' | 'RESEARCHER';
}): Promise<T> {
  const url =
    typeof window === 'undefined' ? `${getInternalApiBaseUrl()}${path}` : path;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-role': role,
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
    role: 'PLATFORM_ADMIN',
  });
}

export function fetchSuspiciousInternalSessions() {
  return fetchInternalApi<InternalSessionOutput[]>({
    path: '/internal/sessions/suspicious',
    role: 'PLATFORM_ADMIN',
  });
}

export function fetchInternalSessionById(sessionId: string) {
  return fetchInternalApi<InternalSessionOutput>({
    path: `/internal/sessions/${encodeURIComponent(sessionId)}`,
    role: 'PLATFORM_ADMIN',
  });
}

export function fetchInternalAuditEvents() {
  return fetchInternalApi<InternalAuditEvent[]>({
    path: '/internal/audit',
    role: 'PLATFORM_ADMIN',
  });
}

export function fetchAnalyticsExportDefinitions() {
  return fetchInternalApi<AnalyticsExportDefinition[]>({
    path: '/internal/exports',
    role: 'RESEARCHER',
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
  itemType: string;
  prompt: string;
  options: unknown;
  correctAnswer: unknown;
  difficulty: string | null;
  status: string;
  version: number;
  active: boolean;
  historicallyActive: boolean;
  createdAt: string;
  updatedAt: string;
  formAssociationCount: number;
  activeFormAssociationCount: number;
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
    role: 'RESEARCHER',
  });
}

export function fetchInternalItemById(itemId: string) {
  return fetchInternalApi<InternalItemDetailOutput>({
    path: `/internal/items/${encodeURIComponent(itemId)}`,
    role: 'RESEARCHER',
  });
}

export function fetchInternalItemPerformance(itemId: string) {
  return fetchInternalApi<InternalItemPerformanceOutput>({
    path: `/internal/items/${encodeURIComponent(itemId)}/performance`,
    role: 'RESEARCHER',
  });
}

export function fetchSectionPerformanceSummaries() {
  return fetchInternalApi<InternalSectionPerformanceSummary[]>({
    path: '/internal/performance/sections',
    role: 'RESEARCHER',
  });
}

export function fetchFormPerformanceSummaries() {
  return fetchInternalApi<InternalFormPerformanceSummary[]>({
    path: '/internal/performance/forms',
    role: 'RESEARCHER',
  });
}

export function fetchResearcherDashboardOverview() {
  return fetchInternalApi<InternalResearcherDashboardOverview>({
    path: '/internal/researcher/dashboard',
    role: 'RESEARCHER',
  });
}

export function fetchAdminOverview() {
  return fetchInternalApi<InternalAdminOverview>({
    path: '/internal/admin/overview',
    role: 'PLATFORM_ADMIN',
  });
}

export function fetchInternalItemTraceability(itemId: string) {
  return fetchInternalApi<InternalItemTraceabilityOutput>({
    path: `/internal/items/${encodeURIComponent(itemId)}/traceability`,
    role: 'RESEARCHER',
  });
}

export function fetchReportScoreAuditRecords() {
  return fetchInternalApi<InternalReportScoreAuditOutput[]>({
    path: '/internal/reports/score-audit',
    role: 'RESEARCHER',
  });
}
export function createInternalDraftItem(input: CreateInternalDraftItemInput) {
  return writeInternalApi<InternalItemDetailOutput>({
    path: '/internal/api/items',
    method: 'POST',
    role: 'RESEARCHER',
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
    role: 'RESEARCHER',
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
    role: 'RESEARCHER',
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
    role: 'RESEARCHER',
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
    role: 'RESEARCHER',
    body: input,
  });
}
