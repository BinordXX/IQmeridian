import { Injectable } from '@nestjs/common';

import {
  AnalyticsExportDefinition,
  InternalSessionOutput,
  InternalSessionSourceRecord,
  SuspiciousFlagEvaluation,
  SuspiciousFlagStatus,
  SuspiciousSessionIndicator,
} from './internal-tooling.types';

const internalSessionSourceRecords: InternalSessionSourceRecord[] = [
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
    completionTimeMinutes: 33,
    refreshReconnectEvents: 1,
    omissionRate: 0.04,
    duplicateAccessAttempts: 0,
    inconsistentSubmissionEvents: 0,
    compressedTimingEvents: 2,
    interruptionHistory: [
      'One short focus-loss event was recorded during the abstract section.',
    ],
    responsePatternSummary:
      'Long inactivity followed by a compressed answer sequence near section end.',
    scoringOutcome:
      'Overall band was Strong, with uneven timing across later abstract items.',
    reviewerNotes: [
      'Timing signal requires review, but no access anomaly is currently visible.',
    ],
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
    completionTimeMinutes: 19,
    refreshReconnectEvents: 6,
    omissionRate: 0.02,
    duplicateAccessAttempts: 3,
    inconsistentSubmissionEvents: 2,
    compressedTimingEvents: 5,
    interruptionHistory: [
      'Repeated reconnect events were recorded.',
      'Multiple route escape attempts occurred before final submission.',
      'The same invitation token was accessed repeatedly within a short window.',
    ],
    responsePatternSummary:
      'Several high-difficulty items were answered with unusually compressed timing.',
    scoringOutcome:
      'Overall band was Advanced despite an unusually short completion profile.',
    reviewerNotes: [
      'High-priority review recommended before relying on this session outcome.',
    ],
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
    completionTimeMinutes: null,
    refreshReconnectEvents: 4,
    omissionRate: 0.11,
    duplicateAccessAttempts: 0,
    inconsistentSubmissionEvents: 0,
    compressedTimingEvents: 0,
    interruptionHistory: [
      'Four reconnect events were recorded while the session remained open.',
    ],
    responsePatternSummary:
      'Reconnect events occurred, but response timing remains broadly plausible.',
    scoringOutcome:
      'No final score has been produced because the session is open.',
    reviewerNotes: [
      'Monitor if the session later completes with unusual timing or omissions.',
    ],
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
    completionTimeMinutes: 52,
    refreshReconnectEvents: 0,
    omissionRate: 0.38,
    duplicateAccessAttempts: 0,
    inconsistentSubmissionEvents: 0,
    compressedTimingEvents: 0,
    interruptionHistory: ['No interruption event was recorded.'],
    responsePatternSummary:
      'Timing was slow but not erratic; omissions were concentrated in the numerical section.',
    scoringOutcome:
      'Overall band was Developing, with high omission volume affecting interpretability.',
    reviewerNotes: [
      'Review whether omissions reflect ability, timing pressure, or interface friction.',
    ],
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
    completionTimeMinutes: 31,
    refreshReconnectEvents: 0,
    omissionRate: 0.05,
    duplicateAccessAttempts: 0,
    inconsistentSubmissionEvents: 0,
    compressedTimingEvents: 0,
    interruptionHistory: ['No interruption event was recorded.'],
    responsePatternSummary: 'No abnormal response timing pattern detected.',
    scoringOutcome: 'Overall band was Functional with no current review flag.',
    reviewerNotes: ['No suspicious-session review required at this stage.'],
  },
];

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
    currentlyAvailable: false,
  },
  {
    dataset: 'SCORE_LEVEL',
    label: 'Score-level data',
    description:
      'Section scores, overall score bands, score spread, and scoring timestamps.',
    format: 'CSV',
    currentlyAvailable: false,
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
  getSessionReviewRecords(): InternalSessionOutput[] {
    return internalSessionSourceRecords.map((session) =>
      this.withSuspiciousFlagEvaluation(session),
    );
  }

  getSuspiciousSessionRecords(): InternalSessionOutput[] {
    return this.getSessionReviewRecords().filter(
      (session) => session.suspiciousFlagStatus !== 'NONE',
    );
  }

  getSessionById(sessionId: string): InternalSessionOutput | undefined {
    return this.getSessionReviewRecords().find(
      (session) => session.sessionId === sessionId,
    );
  }

  getAnalyticsExportDefinitions(): AnalyticsExportDefinition[] {
    return analyticsExportDefinitions;
  }

  private withSuspiciousFlagEvaluation(
    session: InternalSessionSourceRecord,
  ): InternalSessionOutput {
    const evaluation = this.evaluateSuspiciousFlags(session);

    return {
      ...session,
      suspiciousFlagStatus: evaluation.status,
      suspiciousIndicators: evaluation.indicators,
      suspiciousFlagReasons: evaluation.reasons,
    };
  }

  private evaluateSuspiciousFlags(
    session: InternalSessionSourceRecord,
  ): SuspiciousFlagEvaluation {
    const indicators: SuspiciousSessionIndicator[] = [];
    const reasons: string[] = [];

    if (
      session.status === 'COMPLETED' &&
      session.completionTimeMinutes !== null &&
      session.completionTimeMinutes < 20
    ) {
      indicators.push('UNUSUALLY_SHORT_COMPLETION_TIME');
      reasons.push(
        'Completed session below the minimum expected time threshold.',
      );
    }

    if (session.refreshReconnectEvents >= 4) {
      indicators.push('REPEATED_REFRESH_RECONNECT');
      reasons.push('Repeated refresh or reconnect events were recorded.');
    }

    if (session.compressedTimingEvents >= 2) {
      indicators.push('ABNORMAL_RESPONSE_TIMING');
      reasons.push('Compressed response timing pattern was detected.');
    }

    if (session.duplicateAccessAttempts >= 2) {
      indicators.push('DUPLICATE_ACCESS_ANOMALY');
      reasons.push('Duplicate or repeated access behaviour was recorded.');
    }

    if (session.inconsistentSubmissionEvents >= 1) {
      indicators.push('INCONSISTENT_SUBMISSION_PATTERN');
      reasons.push('Submission behaviour was inconsistent with normal flow.');
    }

    if (session.omissionRate >= 0.3) {
      indicators.push('EXTREME_OMISSION_BEHAVIOUR');
      reasons.push('Omission rate exceeded the internal review threshold.');
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
}
