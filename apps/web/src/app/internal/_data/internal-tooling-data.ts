export type InternalItemDomain =
  | 'ABSTRACT'
  | 'NUMERICAL'
  | 'VERBAL'
  | 'SPATIAL'
  | 'WORKING_MEMORY';

export type InternalItemStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'RETIRED'
  | 'UNDER_REVIEW';

export type InternalItemType =
  | 'multiple-choice'
  | 'visual-pattern'
  | 'number-series'
  | 'matrix-reasoning'
  | 'verbal-analogy';

export type InternalPerformancePattern =
  | 'VERY_LOW_CORRECT_RATE'
  | 'VERY_HIGH_CORRECT_RATE'
  | 'LOW_EXPOSURE'
  | 'HIGH_OMISSION'
  | 'HIGH_AVERAGE_TIME'
  | 'RETIRED_OR_FLAGGED';

export type ItemStatusHistoryEntry = {
  id: string;
  status: InternalItemStatus;
  actor: string;
  reason: string;
  occurredAt: string;
};

export type ItemFormAssociation = {
  formId: string;
  formLabel: string;
  section: InternalItemDomain;
  position: number;
  active: boolean;
};

export type ItemPerformance = {
  exposureCount: number;
  validResponses: number;
  correctResponseRate: number;
  omissionCount: number;
  averageResponseTimeSeconds: number | null;
  activeFormAssociations: number;
};

export type InternalItem = {
  id: string;
  label: string;
  domain: InternalItemDomain;
  itemType: InternalItemType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  difficultyEstimate: string;
  distractorRationale: string;
  timeExpectationSeconds: number;
  status: InternalItemStatus;
  active: boolean;
  historicallyActive: boolean;
  explanationNotes?: string;
  assetLink?: string;
  lastReviewedAt?: string;
  flaggedReason?: string;
  statusHistory: ItemStatusHistoryEntry[];
  formAssociations: ItemFormAssociation[];
  performance: ItemPerformance;
  reviewNotes: string[];
};

export type SuspiciousFlag = {
  id: string;
  sessionId: string;
  signal: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  raisedAt: string;
};

export const itemDomainLabels: Record<InternalItemDomain, string> = {
  ABSTRACT: 'Abstract reasoning',
  NUMERICAL: 'Numerical reasoning',
  VERBAL: 'Verbal reasoning',
  SPATIAL: 'Spatial reasoning',
  WORKING_MEMORY: 'Working memory',
};

export const itemStatusLabels: Record<InternalItemStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  RETIRED: 'Retired',
  UNDER_REVIEW: 'Under review',
};

export const performancePatternLabels: Record<
  InternalPerformancePattern,
  string
> = {
  VERY_LOW_CORRECT_RATE: 'Very low correct rate',
  VERY_HIGH_CORRECT_RATE: 'Very high correct rate',
  LOW_EXPOSURE: 'Low exposure',
  HIGH_OMISSION: 'High omission',
  HIGH_AVERAGE_TIME: 'High average time',
  RETIRED_OR_FLAGGED: 'Retired or flagged',
};

export const internalItems: InternalItem[] = [
  {
    id: 'IQM-ABS-001',
    label: 'Matrix progression baseline',
    domain: 'ABSTRACT',
    itemType: 'matrix-reasoning',
    prompt: 'Identify the missing figure in a visual matrix sequence.',
    options: [
      'A. Rotated black triangle',
      'B. Mirrored white circle',
      'C. Rotated striped square',
      'D. Unchanged grey diamond',
    ],
    correctAnswer: 'C',
    difficultyEstimate: 'Medium',
    distractorRationale:
      'Distractors preserve surface symmetry while violating the underlying rotation rule.',
    timeExpectationSeconds: 75,
    status: 'ACTIVE',
    active: true,
    historicallyActive: true,
    explanationNotes:
      'Used as a stable baseline item for abstract reasoning calibration.',
    assetLink: 'asset://abstract/matrix-001',
    lastReviewedAt: '2026-06-02',
    flaggedReason: undefined,
    statusHistory: [
      {
        id: 'HIST-ABS-001-1',
        status: 'DRAFT',
        actor: 'Researcher',
        reason: 'Initial authoring completed.',
        occurredAt: '2026-05-20 10:15',
      },
      {
        id: 'HIST-ABS-001-2',
        status: 'ACTIVE',
        actor: 'Platform admin',
        reason: 'Activated after internal review.',
        occurredAt: '2026-05-23 14:40',
      },
    ],
    formAssociations: [
      {
        formId: 'FORM-A',
        formLabel: 'General cognitive form A',
        section: 'ABSTRACT',
        position: 1,
        active: true,
      },
    ],
    performance: {
      exposureCount: 118,
      validResponses: 109,
      correctResponseRate: 0.62,
      omissionCount: 9,
      averageResponseTimeSeconds: 58,
      activeFormAssociations: 1,
    },
    reviewNotes: [
      'Current performance appears plausible for a medium abstract reasoning item.',
      'Continue monitoring because baseline items can become overexposed if reused heavily.',
    ],
  },
  {
    id: 'IQM-NUM-004',
    label: 'Number series proportional shift',
    domain: 'NUMERICAL',
    itemType: 'number-series',
    prompt: 'Determine the next value in a proportional number sequence.',
    options: ['A. 18', 'B. 21', 'C. 24', 'D. 27'],
    correctAnswer: 'C',
    difficultyEstimate: 'Medium-high',
    distractorRationale:
      'Distractors reflect additive interpretations rather than proportional pattern recognition.',
    timeExpectationSeconds: 90,
    status: 'UNDER_REVIEW',
    active: false,
    historicallyActive: true,
    flaggedReason: 'Lower than expected discrimination in recent sessions.',
    explanationNotes:
      'Requires psychometric review before any future activation decision.',
    lastReviewedAt: '2026-06-05',
    statusHistory: [
      {
        id: 'HIST-NUM-004-1',
        status: 'DRAFT',
        actor: 'Researcher',
        reason: 'Initial numerical item authored.',
        occurredAt: '2026-05-21 09:20',
      },
      {
        id: 'HIST-NUM-004-2',
        status: 'ACTIVE',
        actor: 'Platform admin',
        reason: 'Activated for pilot form use.',
        occurredAt: '2026-05-25 13:00',
      },
      {
        id: 'HIST-NUM-004-3',
        status: 'UNDER_REVIEW',
        actor: 'Researcher',
        reason: 'Flagged after weak operational behaviour.',
        occurredAt: '2026-06-05 16:10',
      },
    ],
    formAssociations: [
      {
        formId: 'FORM-B',
        formLabel: 'General cognitive form B',
        section: 'NUMERICAL',
        position: 4,
        active: false,
      },
    ],
    performance: {
      exposureCount: 77,
      validResponses: 68,
      correctResponseRate: 0.18,
      omissionCount: 9,
      averageResponseTimeSeconds: 104,
      activeFormAssociations: 0,
    },
    reviewNotes: [
      'Correct-response rate is lower than expected for the intended difficulty estimate.',
      'Average response time suggests the item may be more complex than its current calibration label.',
    ],
  },
  {
    id: 'IQM-VER-002',
    label: 'Analogy relation classification',
    domain: 'VERBAL',
    itemType: 'verbal-analogy',
    prompt: 'Select the option that preserves the same conceptual relation.',
    options: [
      'A. Category relation',
      'B. Functional relation',
      'C. Temporal relation',
      'D. Oppositional relation',
    ],
    correctAnswer: 'B',
    difficultyEstimate: 'Medium',
    distractorRationale:
      'Distractors test whether candidates confuse category membership with functional relation.',
    timeExpectationSeconds: 60,
    status: 'DRAFT',
    active: false,
    historicallyActive: false,
    explanationNotes: 'Draft item awaiting internal review before activation.',
    statusHistory: [
      {
        id: 'HIST-VER-002-1',
        status: 'DRAFT',
        actor: 'Researcher',
        reason: 'Draft created for verbal reasoning expansion.',
        occurredAt: '2026-06-01 11:05',
      },
    ],
    formAssociations: [],
    performance: {
      exposureCount: 0,
      validResponses: 0,
      correctResponseRate: 0,
      omissionCount: 0,
      averageResponseTimeSeconds: null,
      activeFormAssociations: 0,
    },
    reviewNotes: [
      'No performance evidence is available because the item has not been activated.',
    ],
  },
  {
    id: 'IQM-SPA-003',
    label: 'Mental rotation block item',
    domain: 'SPATIAL',
    itemType: 'visual-pattern',
    prompt: 'Choose the rotated equivalent of the reference object.',
    options: [
      'A. Valid rotation',
      'B. Mirror image',
      'C. Distorted rotation',
      'D. Unrelated object',
    ],
    correctAnswer: 'A',
    difficultyEstimate: 'High',
    distractorRationale:
      'Distractors introduce mirror transformations rather than valid rotations.',
    timeExpectationSeconds: 105,
    status: 'RETIRED',
    active: false,
    historicallyActive: true,
    explanationNotes:
      'Retired after review because item exposure became too high.',
    assetLink: 'asset://spatial/rotation-003',
    lastReviewedAt: '2026-05-28',
    statusHistory: [
      {
        id: 'HIST-SPA-003-1',
        status: 'DRAFT',
        actor: 'Researcher',
        reason: 'Spatial reasoning item authored.',
        occurredAt: '2026-05-12 15:45',
      },
      {
        id: 'HIST-SPA-003-2',
        status: 'ACTIVE',
        actor: 'Platform admin',
        reason: 'Activated for pilot testing.',
        occurredAt: '2026-05-16 10:25',
      },
      {
        id: 'HIST-SPA-003-3',
        status: 'RETIRED',
        actor: 'Platform admin',
        reason: 'Retired because exposure became too high.',
        occurredAt: '2026-05-28 12:35',
      },
    ],
    formAssociations: [
      {
        formId: 'FORM-A',
        formLabel: 'General cognitive form A',
        section: 'SPATIAL',
        position: 7,
        active: false,
      },
    ],
    performance: {
      exposureCount: 240,
      validResponses: 225,
      correctResponseRate: 0.91,
      omissionCount: 15,
      averageResponseTimeSeconds: 81,
      activeFormAssociations: 0,
    },
    reviewNotes: [
      'Retired because exposure count is high and correct-response rate has become unusually high.',
      'A versioned successor should be created instead of reusing this item.',
    ],
  },
  {
    id: 'IQM-WM-006',
    label: 'Working memory ordering item',
    domain: 'WORKING_MEMORY',
    itemType: 'multiple-choice',
    prompt:
      'Reconstruct the correct order after a short stimulus presentation.',
    options: ['A. 2-4-1-3', 'B. 3-1-4-2', 'C. 1-3-2-4', 'D. 4-2-3-1'],
    correctAnswer: 'D',
    difficultyEstimate: 'Low-medium',
    distractorRationale:
      'Distractors preserve partial ordering but disrupt final sequence accuracy.',
    timeExpectationSeconds: 45,
    status: 'DRAFT',
    active: false,
    historicallyActive: false,
    explanationNotes: 'Needs timing validation before operational use.',
    statusHistory: [
      {
        id: 'HIST-WM-006-1',
        status: 'DRAFT',
        actor: 'Researcher',
        reason: 'Draft created for working-memory section.',
        occurredAt: '2026-06-03 08:50',
      },
    ],
    formAssociations: [],
    performance: {
      exposureCount: 0,
      validResponses: 0,
      correctResponseRate: 0,
      omissionCount: 0,
      averageResponseTimeSeconds: null,
      activeFormAssociations: 0,
    },
    reviewNotes: [
      'Timing behaviour must be tested before operational activation.',
    ],
  },
];

export const internalOperationalSnapshot = {
  activeCampaigns: 3,
  totalSessions: 128,
  completedSessions: 94,
  itemsUnderReview: internalItems.filter(
    (item) => item.status === 'UNDER_REVIEW'
  ).length,
  exportAvailability:
    'Session, response, item, score, and audit exports available',
  recentSuspiciousFlags: [
    {
      id: 'FLAG-001',
      sessionId: 'SES-091',
      signal: 'Rapid answer pattern after prolonged inactivity',
      severity: 'MEDIUM',
      raisedAt: '2026-06-06 09:42',
    },
    {
      id: 'FLAG-002',
      sessionId: 'SES-104',
      signal: 'Repeated route escape attempt during live assessment',
      severity: 'HIGH',
      raisedAt: '2026-06-06 11:18',
    },
    {
      id: 'FLAG-003',
      sessionId: 'SES-117',
      signal: 'Multiple reconnect events within one section',
      severity: 'LOW',
      raisedAt: '2026-06-06 13:07',
    },
  ] satisfies SuspiciousFlag[],
};

export function getInternalItemById(itemId: string) {
  return internalItems.find((item) => item.id === itemId);
}

export function getDraftItems() {
  return internalItems.filter((item) => item.status === 'DRAFT');
}

export function formatCorrectRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

export function evaluateItemPerformancePatterns(
  item: InternalItem
): InternalPerformancePattern[] {
  const patterns: InternalPerformancePattern[] = [];

  if (
    item.performance.validResponses >= 20 &&
    item.performance.correctResponseRate <= 0.25
  ) {
    patterns.push('VERY_LOW_CORRECT_RATE');
  }

  if (
    item.performance.validResponses >= 20 &&
    item.performance.correctResponseRate >= 0.9
  ) {
    patterns.push('VERY_HIGH_CORRECT_RATE');
  }

  if (item.performance.exposureCount < 20) {
    patterns.push('LOW_EXPOSURE');
  }

  if (item.performance.omissionCount >= 10) {
    patterns.push('HIGH_OMISSION');
  }

  if (
    item.performance.averageResponseTimeSeconds !== null &&
    item.performance.averageResponseTimeSeconds >= 100
  ) {
    patterns.push('HIGH_AVERAGE_TIME');
  }

  if (
    item.status === 'RETIRED' ||
    item.status === 'UNDER_REVIEW' ||
    Boolean(item.flaggedReason)
  ) {
    patterns.push('RETIRED_OR_FLAGGED');
  }

  return patterns;
}

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

export type ScoreDistributionBucket = {
  label: string;
  count: number;
};

export type SectionPerformanceSummary = {
  section: Extract<InternalItemDomain, 'ABSTRACT' | 'NUMERICAL'>;
  startedSessions: number;
  completedSessions: number;
  completionRate: number;
  averageScorePercent: number;
  averageCompletionTimeMinutes: number;
  scoreDistribution: ScoreDistributionBucket[];
};

export type FormPerformanceSummary = {
  formId: string;
  formLabel: string;
  startedSessions: number;
  completedSessions: number;
  completionRate: number;
  averageCompletionTimeMinutes: number;
  scoreSpread: ScoreDistributionBucket[];
};

export type InternalSessionReviewRecord = {
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
  suspiciousFlagStatus: SuspiciousFlagStatus;
  suspiciousIndicators: SuspiciousSessionIndicator[];
  completionTimeMinutes: number | null;
  refreshReconnectEvents: number;
  omissionRate: number;
  responseTimingPattern: string;
  accessAnomaly: string;
  submissionPattern: string;
};

export const sessionTypeLabels: Record<InternalSessionType, string> = {
  EMPLOYER_LINKED: 'Employer-linked',
  CONSUMER: 'Consumer',
};

export const sessionStatusLabels: Record<InternalSessionStatus, string> = {
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
  ABANDONED: 'Abandoned',
};

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

export const sectionPerformanceSummaries: SectionPerformanceSummary[] = [
  {
    section: 'ABSTRACT',
    startedSessions: 118,
    completedSessions: 104,
    completionRate: 0.88,
    averageScorePercent: 64,
    averageCompletionTimeMinutes: 11.4,
    scoreDistribution: [
      { label: '0–25%', count: 9 },
      { label: '26–50%', count: 28 },
      { label: '51–75%', count: 47 },
      { label: '76–100%', count: 20 },
    ],
  },
  {
    section: 'NUMERICAL',
    startedSessions: 113,
    completedSessions: 91,
    completionRate: 0.81,
    averageScorePercent: 52,
    averageCompletionTimeMinutes: 14.8,
    scoreDistribution: [
      { label: '0–25%', count: 17 },
      { label: '26–50%', count: 34 },
      { label: '51–75%', count: 29 },
      { label: '76–100%', count: 11 },
    ],
  },
];

export const formPerformanceSummaries: FormPerformanceSummary[] = [
  {
    formId: 'FORM-A',
    formLabel: 'General cognitive form A',
    startedSessions: 64,
    completedSessions: 58,
    completionRate: 0.91,
    averageCompletionTimeMinutes: 32.5,
    scoreSpread: [
      { label: 'Developing', count: 11 },
      { label: 'Functional', count: 24 },
      { label: 'Strong', count: 18 },
      { label: 'Advanced', count: 5 },
    ],
  },
  {
    formId: 'FORM-B',
    formLabel: 'General cognitive form B',
    startedSessions: 49,
    completedSessions: 33,
    completionRate: 0.67,
    averageCompletionTimeMinutes: 41.2,
    scoreSpread: [
      { label: 'Developing', count: 15 },
      { label: 'Functional', count: 12 },
      { label: 'Strong', count: 5 },
      { label: 'Advanced', count: 1 },
    ],
  },
  {
    formId: 'FORM-C',
    formLabel: 'Consumer practice form',
    startedSessions: 37,
    completedSessions: 29,
    completionRate: 0.78,
    averageCompletionTimeMinutes: 28.9,
    scoreSpread: [
      { label: 'Developing', count: 7 },
      { label: 'Functional', count: 14 },
      { label: 'Strong', count: 7 },
      { label: 'Advanced', count: 1 },
    ],
  },
];

export const internalSessionReviewRecords: InternalSessionReviewRecord[] = [
  {
    sessionId: 'SES-091',
    participantIdentifier: 'candidate-091',
    sessionType: 'EMPLOYER_LINKED',
    formId: 'FORM-A',
    formLabel: 'General cognitive form A',
    status: 'COMPLETED',
    startedAt: '2026-06-06 09:01',
    endedAt: '2026-06-06 09:34',
    completionStatus: 'COMPLETE',
    overallBand: 'Strong',
    suspiciousFlagStatus: 'MEDIUM',
    suspiciousIndicators: ['ABNORMAL_RESPONSE_TIMING'],
    completionTimeMinutes: 33,
    refreshReconnectEvents: 1,
    omissionRate: 0.04,
    responseTimingPattern:
      'Long inactivity followed by rapid answer sequence near section end.',
    accessAnomaly: 'No duplicate access detected.',
    submissionPattern: 'Single final submission.',
  },
  {
    sessionId: 'SES-104',
    participantIdentifier: 'candidate-104',
    sessionType: 'EMPLOYER_LINKED',
    formId: 'FORM-B',
    formLabel: 'General cognitive form B',
    status: 'COMPLETED',
    startedAt: '2026-06-06 10:42',
    endedAt: '2026-06-06 11:01',
    completionStatus: 'COMPLETE',
    overallBand: 'Advanced',
    suspiciousFlagStatus: 'HIGH',
    suspiciousIndicators: [
      'UNUSUALLY_SHORT_COMPLETION_TIME',
      'REPEATED_REFRESH_RECONNECT',
      'DUPLICATE_ACCESS_ANOMALY',
      'INCONSISTENT_SUBMISSION_PATTERN',
    ],
    completionTimeMinutes: 19,
    refreshReconnectEvents: 6,
    omissionRate: 0.02,
    responseTimingPattern:
      'Several high-difficulty items answered with unusually compressed timing.',
    accessAnomaly:
      'Repeated access attempts from the same invitation token within a short window.',
    submissionPattern:
      'Submission completed after multiple route escape and reconnect events.',
  },
  {
    sessionId: 'SES-117',
    participantIdentifier: 'consumer-117',
    sessionType: 'CONSUMER',
    formId: 'FORM-C',
    formLabel: 'Consumer practice form',
    status: 'IN_PROGRESS',
    startedAt: '2026-06-06 13:03',
    endedAt: null,
    completionStatus: 'PARTIAL',
    overallBand: null,
    suspiciousFlagStatus: 'LOW',
    suspiciousIndicators: ['REPEATED_REFRESH_RECONNECT'],
    completionTimeMinutes: null,
    refreshReconnectEvents: 4,
    omissionRate: 0.11,
    responseTimingPattern:
      'Reconnect events occurred, but response timing remains broadly plausible.',
    accessAnomaly: 'No duplicate access detected.',
    submissionPattern: 'No final submission yet.',
  },
  {
    sessionId: 'SES-122',
    participantIdentifier: 'candidate-122',
    sessionType: 'EMPLOYER_LINKED',
    formId: 'FORM-B',
    formLabel: 'General cognitive form B',
    status: 'COMPLETED',
    startedAt: '2026-06-06 14:10',
    endedAt: '2026-06-06 15:02',
    completionStatus: 'COMPLETE',
    overallBand: 'Developing',
    suspiciousFlagStatus: 'MEDIUM',
    suspiciousIndicators: ['EXTREME_OMISSION_BEHAVIOUR'],
    completionTimeMinutes: 52,
    refreshReconnectEvents: 0,
    omissionRate: 0.38,
    responseTimingPattern:
      'Timing was slow but not erratic; omissions concentrated in numerical section.',
    accessAnomaly: 'No duplicate access detected.',
    submissionPattern: 'Single final submission with high omission volume.',
  },
  {
    sessionId: 'SES-128',
    participantIdentifier: 'consumer-128',
    sessionType: 'CONSUMER',
    formId: 'FORM-C',
    formLabel: 'Consumer practice form',
    status: 'COMPLETED',
    startedAt: '2026-06-06 15:18',
    endedAt: '2026-06-06 15:49',
    completionStatus: 'COMPLETE',
    overallBand: 'Functional',
    suspiciousFlagStatus: 'NONE',
    suspiciousIndicators: [],
    completionTimeMinutes: 31,
    refreshReconnectEvents: 0,
    omissionRate: 0.05,
    responseTimingPattern: 'No abnormal response timing pattern detected.',
    accessAnomaly: 'No duplicate access detected.',
    submissionPattern: 'Single final submission.',
  },
];

export function formatInternalRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

export function formatInternalDuration(minutes: number | null) {
  if (minutes === null) {
    return 'In progress';
  }

  return `${minutes} min`;
}

export function getSuspiciousSessionRecords() {
  return internalSessionReviewRecords.filter(
    (session) =>
      session.suspiciousFlagStatus !== 'NONE' ||
      session.suspiciousIndicators.length > 0
  );
}
