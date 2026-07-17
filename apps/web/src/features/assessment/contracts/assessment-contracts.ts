export type InvitationStatus =
  | 'valid'
  | 'invalid'
  | 'expired'
  | 'used'
  | 'cancelled';

export type AssessmentSessionStatus =
  | 'not_started'
  | 'ready'
  | 'active'
  | 'paused'
  | 'section_ended'
  | 'submitted'
  | 'completed'
  | 'expired'
  | 'cancelled';

export type AssessmentItemType =
  | 'abstract_reasoning'
  | 'numerical_reasoning'
  | 'verbal_reasoning'
  | 'situational_judgement';

export type CandidateStimulusKind =
  | 'text'
  | 'image'
  | 'table'
  | 'sequence'
  | 'pattern';

export type CandidateItemOption = {
  optionId: string;
  label: string;
  text?: string;
  imageUrl?: string;
};

export type CandidateItemStimulus = {
  kind: CandidateStimulusKind;
  content: string;
  altText?: string;
};

export type CandidateSafeAssessmentItem = {
  itemId: string;
  sectionId: string;
  itemType: AssessmentItemType;
  position: number;
  stem: string;
  prompt?: string;
  stimulus?: CandidateItemStimulus;
  options: CandidateItemOption[];
  timeLimitSeconds?: number;
};

export type CandidateAssessmentSectionSummary = {
  sectionId: string;
  title: string;
  instructions: string;
  position: number;
  itemCount: number;
  timeLimitSeconds?: number;
};

export type CandidateAssessmentSection = CandidateAssessmentSectionSummary & {
  items: CandidateSafeAssessmentItem[];
};

export type InvitationValidationResult = {
  token: string;
  status: InvitationStatus;
  assessmentId?: string;
  assessmentTitle?: string;
  candidateName?: string;
  candidateEmail?: string;
  expiresAt?: string;
  sections?: CandidateAssessmentSectionSummary[];
  message?: string;
};

export type CreateAssessmentSessionInput = {
  invitationToken: string;
  applicantName?: string;
  consentAccepted?: boolean;
};

export type CreateAssessmentSessionResult = {
  sessionId: string;
  assessmentId: string;
  status: AssessmentSessionStatus;
  expiresAt?: string;
  sessionAccessToken?: string | null;
};

export type AssessmentSessionTiming = {
  serverNow?: string;
  expiresAt?: string;
  sectionExpiresAt?: string;
  remainingSeconds?: number;
  sectionRemainingSeconds?: number;
};

export type AssessmentSessionPayload = {
  sessionId: string;
  assessmentId: string;
  assessmentTitle: string;
  candidateName?: string;
  status: AssessmentSessionStatus;
  startedAt?: string;
  expiresAt?: string;
  serverNow?: string;
  timing?: AssessmentSessionTiming;
  currentSectionId?: string;
  currentItemId?: string;
  sections: CandidateAssessmentSection[];
};

export type AssessmentResponseValue =
  | string
  | string[]
  | number
  | boolean
  | null;

export type SaveAssessmentResponseInput = {
  sectionId: string;
  itemId: string;
  responseValue: AssessmentResponseValue;
  clientSavedAt: string;
  timeSpentSeconds?: number;
};

export type SavedAssessmentResponse = {
  sectionId: string;
  itemId: string;
  responseValue: AssessmentResponseValue;
  savedAt: string;
};

export type SaveAssessmentResponseResult = {
  sessionId: string;
  response: SavedAssessmentResponse;
  status: 'saved';
};

export type AssessmentResponsesResult = {
  sessionId: string;
  responses: SavedAssessmentResponse[];
};

export type FinaliseAssessmentSessionResult = {
  sessionId: string;
  status: 'submitted' | 'completed';
  submittedAt: string;
  psychometricScoring?: {
    status: 'already_scored' | 'scored' | 'failed';
    scoreResultId?: string | null;
    scoringStatus?: string | null;
    modelVersion?: string | null;
    generatedAt?: string | null;
    message?: string;
  };
};

export type AssessmentScoreResult = {
  sessionId: string;
  assessmentId: string;
  totalRawScore: number;
  maxRawScore: number;
  percentageScore: number;
  band?: string;
  domainBreakdown?: Array<{
    domain: string;
    rawScore: number;
    maxRawScore: number;
    percentageScore: number;
  }>;
};

export type GenerateAssessmentReportResult = {
  reportId: string;
  sessionId: string;
  generatedAt: string;
};

export type AssessmentReportResult = {
  reportId: string;
  sessionId: string;
  assessmentTitle: string;
  candidateName?: string;
  generatedAt: string;
  score: AssessmentScoreResult;
  interpretation?: string;
  recommendations?: string[];
};

export type CandidateResultSummaryAudience = 'employer-invited' | 'consumer';

export type CandidateResultSummaryResult = {
  visibility: 'summary' | 'hidden';
  audience?: CandidateResultSummaryAudience;
  reason?: 'not_completed' | 'policy_hidden' | 'not_scored';
  overallBand?: string | null;
  abstractReasoningBand?: string | null;
  numericalReasoningBand?: string | null;
};

const forbiddenCandidateItemFields = new Set([
  'correctAnswer',
  'correctOptionId',
  'answerKey',
  'scoringKey',
  'scoringMetadata',
  'scoreWeight',
  'difficulty',
  'discrimination',
  'guessing',
  'irtA',
  'irtB',
  'irtC',
  'rationale',
  'explanation',
]);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const collectUnsafeFields = (
  value: unknown,
  path: string,
  unsafeFields: string[]
): void => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectUnsafeFields(entry, `${path}[${index}]`, unsafeFields);
    });
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    const nestedPath = path ? `${path}.${key}` : key;

    if (forbiddenCandidateItemFields.has(key)) {
      unsafeFields.push(nestedPath);
    }

    collectUnsafeFields(nestedValue, nestedPath, unsafeFields);
  });
};

export const assertCandidateSafeAssessmentPayload = (
  payload: AssessmentSessionPayload
): void => {
  const unsafeFields: string[] = [];

  collectUnsafeFields(payload.sections, 'sections', unsafeFields);

  if (unsafeFields.length > 0) {
    throw new Error(
      `Unsafe candidate assessment payload. Forbidden fields detected: ${unsafeFields.join(
        ', '
      )}`
    );
  }
};
