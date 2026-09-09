import type {
  CandidateResultThresholdConfig,
  EmployerSessionSummary,
  PsychometricScoreBand,
} from '../api/employer-dashboard-api';

export type CandidateThresholdClassification =
  | 'meets_filter'
  | 'below_filter'
  | 'not_scored'
  | 'not_completed'
  | 'review_required';

export const defaultCandidateResultThresholdConfig: CandidateResultThresholdConfig =
  {
    enabled: false,
    minimumOverallBand: null,
    minimumAbstractReasoningBand: null,
    minimumNumericalReasoningBand: null,
    hideUnscoredFromFilteredView: true,
    requireNoHighSeverityValidityFlags: false,
  };

const scoreBandOrder: PsychometricScoreBand[] = [
  'VERY_LOW',
  'LOW',
  'BELOW_AVERAGE',
  'AVERAGE',
  'ABOVE_AVERAGE',
  'HIGH',
  'VERY_HIGH',
];

const getBandRank = (band?: string | null) => {
  if (!band) {
    return -1;
  }

  return scoreBandOrder.indexOf(band as PsychometricScoreBand);
};

const bandMeetsMinimum = (
  actualBand?: string | null,
  minimumBand?: PsychometricScoreBand | null
) => {
  if (!minimumBand) {
    return true;
  }

  const actualRank = getBandRank(actualBand);
  const minimumRank = getBandRank(minimumBand);

  return actualRank >= minimumRank && actualRank >= 0 && minimumRank >= 0;
};

export const normaliseCandidateResultThresholdConfig = (
  value?: CandidateResultThresholdConfig | null
): CandidateResultThresholdConfig => {
  if (!value) {
    return defaultCandidateResultThresholdConfig;
  }

  return {
    enabled: value.enabled ?? defaultCandidateResultThresholdConfig.enabled,
    minimumOverallBand:
      value.minimumOverallBand ??
      defaultCandidateResultThresholdConfig.minimumOverallBand,
    minimumAbstractReasoningBand:
      value.minimumAbstractReasoningBand ??
      defaultCandidateResultThresholdConfig.minimumAbstractReasoningBand,
    minimumNumericalReasoningBand:
      value.minimumNumericalReasoningBand ??
      defaultCandidateResultThresholdConfig.minimumNumericalReasoningBand,
    hideUnscoredFromFilteredView:
      value.hideUnscoredFromFilteredView ??
      defaultCandidateResultThresholdConfig.hideUnscoredFromFilteredView,
    requireNoHighSeverityValidityFlags:
      value.requireNoHighSeverityValidityFlags ??
      defaultCandidateResultThresholdConfig.requireNoHighSeverityValidityFlags,
  };
};

const getDomainScoreBand = (
  session: EmployerSessionSummary,
  domain: 'ABSTRACT_REASONING' | 'NUMERICAL_REASONING'
) => {
  return (
    session.psychometricScoreResult?.domainScores?.find((domainScore) => {
      return domainScore.domain === domain;
    })?.scoreBand ?? null
  );
};

const hasHighSeverityValidityFlag = (session: EmployerSessionSummary) => {
  return Boolean(
    session.psychometricScoreResult?.validityFlags?.some((flag) => {
      return flag.severity === 'HIGH' || flag.severity === 'CRITICAL';
    })
  );
};

export const classifyEmployerSessionByThresholds = (
  session: EmployerSessionSummary,
  thresholdConfig?: CandidateResultThresholdConfig | null
): CandidateThresholdClassification => {
  const config = normaliseCandidateResultThresholdConfig(thresholdConfig);

  if (session.status !== 'COMPLETED') {
    return 'not_completed';
  }

  if (!session.psychometricScoreResult) {
    return 'not_scored';
  }

  if (!config.enabled) {
    return 'meets_filter';
  }

  if (
    config.requireNoHighSeverityValidityFlags &&
    hasHighSeverityValidityFlag(session)
  ) {
    return 'review_required';
  }

  const meetsOverall = bandMeetsMinimum(
    session.psychometricScoreResult.overallScoreBand,
    config.minimumOverallBand
  );

  const meetsAbstract = bandMeetsMinimum(
    getDomainScoreBand(session, 'ABSTRACT_REASONING'),
    config.minimumAbstractReasoningBand
  );

  const meetsNumerical = bandMeetsMinimum(
    getDomainScoreBand(session, 'NUMERICAL_REASONING'),
    config.minimumNumericalReasoningBand
  );

  if (!meetsOverall || !meetsAbstract || !meetsNumerical) {
    return 'below_filter';
  }

  return 'meets_filter';
};

export const getCandidateThresholdClassificationLabel = (
  classification: CandidateThresholdClassification
) => {
  switch (classification) {
    case 'meets_filter':
      return 'Meets filter';
    case 'below_filter':
      return 'Below filter';
    case 'not_scored':
      return 'Not scored';
    case 'not_completed':
      return 'Not completed';
    case 'review_required':
      return 'Review required';
  }
};
