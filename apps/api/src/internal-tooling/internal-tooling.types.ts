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
