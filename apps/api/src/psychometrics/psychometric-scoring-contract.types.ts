export const PSYCHOMETRIC_SCORING_CONTRACT_VERSION = '2026-06-25.v1';

export type PsychometricScoringMode =
  | 'BASELINE_CLASSICAL'
  | 'IRT_2PL_PROVISIONAL'
  | 'IRT_3PL_PROVISIONAL'
  | 'MULTIDIMENSIONAL_PROVISIONAL'
  | 'HYBRID_RESEARCH';

export type PsychometricSessionSource =
  | 'CONSUMER_SELF_SERVICE'
  | 'EMPLOYER_CAMPAIGN'
  | 'INVITATION'
  | 'PILOT'
  | 'INTERNAL_RESEARCH';

export type PsychometricItemResponseStatus =
  | 'ANSWERED'
  | 'OMITTED'
  | 'SKIPPED'
  | 'TIMED_OUT'
  | 'NOT_PRESENTED';

export type PsychometricResponseCorrectness =
  | 'CORRECT'
  | 'INCORRECT'
  | 'PARTIAL'
  | 'UNSCORED'
  | 'UNKNOWN';

export type PsychometricValiditySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';

export type PsychometricScoreBand =
  | 'VERY_LOW'
  | 'LOW'
  | 'LOW_AVERAGE'
  | 'AVERAGE'
  | 'HIGH_AVERAGE'
  | 'HIGH'
  | 'VERY_HIGH'
  | 'UNAVAILABLE';

export type PsychometricSessionContext = {
  sessionId: string;
  userId: string | null;
  candidateId: string | null;
  invitationId: string | null;
  campaignId: string | null;
  organisationId: string | null;
  assessmentFormId: string;
  source: PsychometricSessionSource;
  startedAt: string | null;
  completedAt: string | null;
  submittedAt: string | null;
  locale: string | null;
  timezone: string | null;
};

export type PsychometricAssessmentContext = {
  assessmentFormId: string;
  assessmentFormName: string;
  assessmentVersion: string | null;
  formBlueprintVersion: string | null;
  totalPresentedItems: number;
  expectedDurationSeconds: number | null;
  domains: Array<{
    domain: string;
    label: string;
    expectedItemCount: number | null;
    expectedDurationSeconds: number | null;
  }>;
};

export type PsychometricItemCalibration = {
  difficulty: number | null;
  discrimination: number | null;
  guessing: number | null;
  slipping: number | null;
  timeIntensity: number | null;
  calibrationSampleSize: number | null;
  calibrationVersion: string | null;
};

export type PsychometricPresentedItem = {
  itemId: string;
  itemVersion: string | null;
  sequenceIndex: number;
  sectionId: string | null;
  domain: string;
  subdomain: string | null;
  itemType: string;
  maxScore: number;
  correctOptionId: string | null;
  presentedAt: string | null;
  calibration: PsychometricItemCalibration;
  metadata: Record<string, string | number | boolean | null>;
};

export type PsychometricItemResponse = {
  itemId: string;
  selectedOptionId: string | null;
  responseText: string | null;
  status: PsychometricItemResponseStatus;
  correctness: PsychometricResponseCorrectness;
  rawScore: number;
  responseTimeMs: number | null;
  firstInteractionTimeMs: number | null;
  revisionCount: number;
  confidenceRating: number | null;
  answeredAt: string | null;
};

export type PsychometricTimingEvent = {
  eventType:
    | 'SESSION_STARTED'
    | 'SECTION_STARTED'
    | 'ITEM_PRESENTED'
    | 'ITEM_ANSWERED'
    | 'SECTION_COMPLETED'
    | 'SESSION_SUBMITTED'
    | 'VISIBILITY_LOST'
    | 'VISIBILITY_GAINED';
  itemId: string | null;
  sectionId: string | null;
  occurredAt: string;
  durationMs: number | null;
  metadata: Record<string, string | number | boolean | null>;
};

export type PsychometricValidityInput = {
  omissionRate: number;
  rapidGuessingRate: number;
  medianResponseTimeMs: number | null;
  totalResponseTimeMs: number | null;
  suspiciousSessionFlags: string[];
  browserOrDeviceSignals: Record<string, string | number | boolean | null>;
};

export type PsychometricScoringRequest = {
  contractVersion: typeof PSYCHOMETRIC_SCORING_CONTRACT_VERSION;
  requestedScoringMode: PsychometricScoringMode;
  requestedAt: string;
  session: PsychometricSessionContext;
  assessment: PsychometricAssessmentContext;
  items: PsychometricPresentedItem[];
  responses: PsychometricItemResponse[];
  timingEvents: PsychometricTimingEvent[];
  validityInput: PsychometricValidityInput;
};

export type PsychometricDomainScore = {
  domain: string;
  label: string;
  rawScore: number;
  maxRawScore: number;
  accuracy: number | null;
  theta: number | null;
  standardScore: number | null;
  percentile: number | null;
  scoreBand: PsychometricScoreBand;
  standardError: number | null;
  confidenceInterval90: {
    lower: number | null;
    upper: number | null;
  };
  testInformation: number | null;
  reliability: number | null;
  interpretation: string;
};

export type PsychometricTimingProfile = {
  totalResponseTimeMs: number | null;
  medianResponseTimeMs: number | null;
  speedIndex: number | null;
  speedAccuracyTradeoff: string | null;
  rapidGuessingRate: number;
  omissionRate: number;
};

export type PsychometricValidityFlag = {
  code: string;
  label: string;
  severity: PsychometricValiditySeverity;
  description: string;
  evidence: Record<string, string | number | boolean | null>;
};

export type PsychometricScoreAuditTrace = {
  modelVersion: string;
  contractVersion: string;
  calibrationVersion: string | null;
  scoringModeUsed: PsychometricScoringMode;
  generatedAt: string;
  inputHash: string | null;
  warnings: string[];
};

export type PsychometricScoringResponse = {
  contractVersion: typeof PSYCHOMETRIC_SCORING_CONTRACT_VERSION;
  sessionId: string;
  scoringStatus: 'SCORED' | 'PARTIAL' | 'INSUFFICIENT_DATA' | 'FAILED';
  overall: {
    rawScore: number;
    maxRawScore: number;
    accuracy: number | null;
    theta: number | null;
    standardScore: number | null;
    percentile: number | null;
    scoreBand: PsychometricScoreBand;
    standardError: number | null;
    confidenceInterval90: {
      lower: number | null;
      upper: number | null;
    };
    testInformation: number | null;
    reliability: number | null;
    interpretation: string;
  };
  domains: PsychometricDomainScore[];
  timingProfile: PsychometricTimingProfile;
  validityFlags: PsychometricValidityFlag[];
  audit: PsychometricScoreAuditTrace;
};