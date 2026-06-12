export type InternalSessionType = 'EMPLOYER_LINKED' | 'CONSUMER';

export type InternalCompletionStatus = 'NOT_STARTED' | 'PARTIAL' | 'COMPLETE';

export type SuspiciousFlagStatus = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type SuspiciousSessionIndicator =
  | 'UNUSUALLY_SHORT_COMPLETION_TIME'
  | 'REPEATED_REFRESH_RECONNECT'
  | 'ABNORMAL_RESPONSE_TIMING'
  | 'DUPLICATE_ACCESS_ANOMALY'
  | 'INCONSISTENT_SUBMISSION_PATTERN'
  | 'EXTREME_OMISSION_BEHAVIOUR';

export type SuspiciousFlagEvaluation = {
  status: SuspiciousFlagStatus;
  indicators: SuspiciousSessionIndicator[];
  reasons: string[];
};

export type InternalSessionOutput = {
  sessionId: string;
  participantIdentifier: string;
  sessionType: InternalSessionType;
  formId: string;
  formLabel: string;
  formVersion: number;
  formVersionLabel: string | null;
  scoringVersion: number;
  reportVersion: number;
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

export type AnalyticsExportDataset =
  | 'ITEM_LEVEL'
  | 'SESSION_LEVEL'
  | 'RESPONSE_LEVEL'
  | 'SCORE_LEVEL'
  | 'CAMPAIGN_SUMMARY';

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

export type InternalReviewStatus =
  | 'UNDER_REVIEW'
  | 'NEEDS_REVISION'
  | 'APPROVED'
  | 'SUSPICIOUS_REVIEWED'
  | 'FALSE_POSITIVE'
  | 'RETIRE_RECOMMENDED';

export type InternalReviewTargetType = 'ITEM' | 'SESSION';

export type InternalReviewStatusRecord = {
  id: string;
  targetType: InternalReviewTargetType;
  targetId: string;
  status: InternalReviewStatus;
  reviewer: string;
  notes: string;
  updatedAt: string;
};

export type CreateInternalAuditEventInput = {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  userId?: string | null;
  metadata?: unknown;
};

export type CreateInternalReviewStatusInput = {
  targetType: InternalReviewTargetType;
  targetId: string;
  status: InternalReviewStatus;
  reviewer: string;
  notes: string;
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

export type InternalItemPerformanceOutput = {
  itemId: string;
  exposureCount: number;
  validResponses: number;
  correctResponseRate: number;
  omissionCount: number;
  averageResponseTimeSeconds: number | null;
  activeFormAssociations: number;
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
  blueprintValidation: InternalPilotFormBlueprintValidationOutput;
};

export type UpdatePilotFormStatusInput = {
  status: string;
  overrideReason?: string | null;
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

export type CreateInternalItemFormMappingInput = {
  formId: string;
  sectionId?: string | null;
  orderIndex?: number | null;
  status?: string;
  overrideReason?: string | null;
};

export type ActivateInternalItemInput = {
  note?: string | null;
};

export type UpdateInternalDraftItemInput = {
  domain?: string;
  subdomain?: string | null;
  itemFamily?: string | null;
  itemType?: string;
  stimulusType?: string | null;
  prompt?: string;
  options?: unknown;
  correctAnswer?: unknown;
  scoringRule?: string | null;
  difficulty?: string | null;
  intendedDifficulty?: string | null;
  estimatedResponseTimeSec?: number | null;
  cognitiveProcess?: string | null;
  itemRationale?: string | null;
  distractorRationale?: unknown;
  reviewStatus?: string | null;
  psychometricStatus?: string | null;
  note?: string | null;
  overrideReason?: string | null;
};

export type UpdateInternalItemStatusInput = {
  status: 'DRAFT' | 'UNDER_REVIEW' | 'ACTIVE' | 'RETIRED';
  note?: string | null;
};
