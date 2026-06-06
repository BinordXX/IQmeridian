export type InternalSessionType = 'EMPLOYER_LINKED' | 'CONSUMER';

export type InternalSessionStatus =
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'ABANDONED';

export type InternalCompletionStatus = 'NOT_STARTED' | 'PARTIAL' | 'COMPLETE';

export type InternalScoreBand =
  | 'Developing'
  | 'Functional'
  | 'Strong'
  | 'Advanced';

export type SuspiciousFlagStatus = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type SuspiciousSessionIndicator =
  | 'UNUSUALLY_SHORT_COMPLETION_TIME'
  | 'REPEATED_REFRESH_RECONNECT'
  | 'ABNORMAL_RESPONSE_TIMING'
  | 'DUPLICATE_ACCESS_ANOMALY'
  | 'INCONSISTENT_SUBMISSION_PATTERN'
  | 'EXTREME_OMISSION_BEHAVIOUR';

export type InternalSessionSourceRecord = {
  sessionId: string;
  participantIdentifier: string;
  sessionType: InternalSessionType;
  formId: string;
  formLabel: string;
  status: InternalSessionStatus;
  startedAt: string;
  endedAt: string | null;
  completionStatus: InternalCompletionStatus;
  overallBand: InternalScoreBand | null;
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
};

export type SuspiciousFlagEvaluation = {
  status: SuspiciousFlagStatus;
  indicators: SuspiciousSessionIndicator[];
  reasons: string[];
};

export type InternalSessionOutput = InternalSessionSourceRecord & {
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
