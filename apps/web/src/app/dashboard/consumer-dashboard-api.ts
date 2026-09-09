import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';

export type ConsumerAssessmentDefault = {
  assessmentFormId: string;
  assessmentForm: {
    id: string;
    name: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  availability: 'AVAILABLE';
};

export type ConsumerSessionSummary = {
  id: string;
  status: string;
  assessmentFormId?: string | null;
  campaignId?: string | null;
  invitationId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  finalisedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  assessmentForm?: {
    id?: string;
    name?: string | null;
    title?: string | null;
  } | null;
  campaign?: {
    id?: string;
    name?: string | null;
  } | null;
  psychometricScore?: ConsumerPsychometricScoreResult | null;
  psychometricScoreResult?: ConsumerPsychometricScoreResult | null;
};

export type ConsumerPsychometricDomainScore = {
  id: string;
  domain: string;
  label: string;
  rawScore: number;
  maxRawScore: number;
  accuracy: number | null;
  theta: number | null;
  standardScore: number | null;
  percentile: number | null;
  iqScore?: number | null;
  iqPercentile?: number | null;
  iqCi90Lower?: number | null;
  iqCi90Upper?: number | null;
  iqScaleMean?: number;
  iqScaleSd?: number;
  scoreBand: string;
  standardError: number | null;
  ci90Lower: number | null;
  ci90Upper: number | null;
  testInformation: number | null;
  reliability: number | null;
  interpretation: string;
  featureVector?: unknown;
};

export type ConsumerPsychometricValidityFlag = {
  id: string;
  code: string;
  label: string;
  severity: string;
  description: string;
  evidence: unknown;
};

export type ConsumerPsychometricScoreResult = {
  id: string;
  sessionId: string;
  contractVersion: string;
  scoringStatus: string;
  overallRawScore: number;
  overallMaxRawScore: number;
  overallAccuracy: number | null;
  overallTheta: number | null;
  overallStandardScore: number | null;
  overallPercentile: number | null;
  overallIqScore?: number | null;
  overallIqPercentile?: number | null;
  overallIqCi90Lower?: number | null;
  overallIqCi90Upper?: number | null;
  overallIqScaleMean?: number;
  overallIqScaleSd?: number;
  overallScoreBand: string;
  overallStandardError: number | null;
  overallCi90Lower: number | null;
  overallCi90Upper: number | null;
  overallTestInformation: number | null;
  overallReliability: number | null;
  overallInterpretation: string;
  timingTotalResponseTimeMs: number | null;
  timingMedianResponseTimeMs: number | null;
  timingSpeedIndex: number | null;
  timingSpeedAccuracyTradeoff: string | null;
  timingRapidGuessingRate: number;
  timingOmissionRate: number;
  modelVersion: string;
  calibrationVersion: string | null;
  scoringModeUsed: string;
  generatedAt: string;
  inputHash: string | null;
  warnings: unknown;
  scoringEngineVersion?: string | null;
  scoringModelFamily?: string | null;
  scoringModelVersion?: string | null;
  featureSetVersion?: string | null;
  scoringSignalsUsed?: unknown;
  scoringFeatureVector?: unknown;
  scoringFeatureSummary?: unknown;
  validityAdjusted?: boolean;
  leaderboardEligible?: boolean;
  leaderboardIneligibilityReasons?: unknown;
  domainScores: ConsumerPsychometricDomainScore[];
  validityFlags: ConsumerPsychometricValidityFlag[];
  createdAt: string;
  updatedAt: string;
};

type CreateConsumerSessionResponse = {
  id?: string;
  sessionId?: string;
  status?: string;
  assessmentFormId?: string;
};

type SessionsListResponse =
  | ConsumerSessionSummary[]
  | {
      sessions?: ConsumerSessionSummary[];
      items?: ConsumerSessionSummary[];
      data?: ConsumerSessionSummary[];
    };

const getAccessToken = async () => {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    throw new Error(
      'Consumer dashboard API request failed: missing access token.'
    );
  }

  return accessToken;
};

const requestApi = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const accessToken = await getAccessToken();

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let details = '';

    try {
      const errorBody = (await response.json()) as {
        message?: string;
        error?: string;
      };

      details = errorBody.message
        ? ` ${errorBody.message}`
        : errorBody.error
          ? ` ${errorBody.error}`
          : '';
    } catch {
      details = '';
    }

    throw new Error(
      `Consumer dashboard API request failed for ${path}: ${response.status} ${response.statusText}.${details}`
    );
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return null as T;
  }

  return JSON.parse(responseText) as T;
};

const attachEmbeddedPsychometricScores = (
  sessions: ConsumerSessionSummary[]
): ConsumerSessionSummary[] => {
  return sessions.map((session) => ({
    ...session,
    psychometricScore:
      session.psychometricScore ?? session.psychometricScoreResult ?? null,
  }));
};

const normaliseSessions = (
  response: SessionsListResponse
): ConsumerSessionSummary[] => {
  if (Array.isArray(response)) {
    return attachEmbeddedPsychometricScores(response);
  }

  if (Array.isArray(response.sessions)) {
    return attachEmbeddedPsychometricScores(response.sessions);
  }

  if (Array.isArray(response.items)) {
    return attachEmbeddedPsychometricScores(response.items);
  }

  if (Array.isArray(response.data)) {
    return attachEmbeddedPsychometricScores(response.data);
  }

  return [];
};

const isCompletedSessionStatus = (status: string) => {
  return status === 'COMPLETED' || status === 'FINALISED';
};

export const getConsumerAssessmentDefault = async () => {
  return requestApi<ConsumerAssessmentDefault>('/consumer/assessment/default');
};

export const listConsumerSessions = async () => {
  const response = await requestApi<SessionsListResponse>('/sessions');
  return normaliseSessions(response);
};

export const getConsumerSessionPsychometricScore = async (
  sessionId: string
) => {
  return requestApi<ConsumerPsychometricScoreResult | null>(
    `/sessions/${encodeURIComponent(sessionId)}/psychometric-score`
  );
};

export const listConsumerSessionsWithPsychometricScores = async () => {
  const sessions = await listConsumerSessions();

  return Promise.all(
    sessions.map(async (session) => {
      if (session.psychometricScore) {
        return session;
      }

      if (!isCompletedSessionStatus(session.status)) {
        return {
          ...session,
          psychometricScore: null,
        };
      }

      try {
        const psychometricScore = await getConsumerSessionPsychometricScore(
          session.id
        );

        return {
          ...session,
          psychometricScore,
        };
      } catch (error) {
        console.error(
          `Failed to load psychometric score for session ${session.id}`,
          error
        );

        return {
          ...session,
          psychometricScore: null,
        };
      }
    })
  );
};

export const createConsumerAssessmentSession = async () => {
  const created = await requestApi<CreateConsumerSessionResponse>(
    '/sessions/consumer',
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );

  const sessionId = created.sessionId ?? created.id;

  if (!sessionId) {
    throw new Error('Consumer session creation did not return a session ID.');
  }

  return {
    sessionId,
    status: created.status ?? 'NOT_STARTED',
  };
};

export type ConsumerLeaderboardEntry = {
  rank?: number;
  displayName?: string;
  iqScore: number;
  percentile: number | null;
  scoreBand: string;
  generatedAt: string;
};

export type ConsumerLeaderboardSummary = {
  preferences: {
    optIn: boolean;
    displayName: string | null;
  };
  eligibility: {
    eligible: boolean;
    publicListingActive: boolean;
    reasons: string[];
  };
  rank: number | null;
  totalRanked: number;
  entry: ConsumerLeaderboardEntry | null;
};

export type UpdateLeaderboardPreferencesInput = {
  optIn?: boolean;
  displayName?: string | null;
};

export const getMyLeaderboardSummary = async () => {
  return requestApi<ConsumerLeaderboardSummary>('/leaderboard/me');
};

export const updateMyLeaderboardPreferences = async (
  input: UpdateLeaderboardPreferencesInput
) => {
  return requestApi<ConsumerLeaderboardSummary>('/leaderboard/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
};

export type ConsumerPublicProfile = {
  profile: {
    publicProfileEnabled: boolean;
    profileSlug: string | null;
    displayName: string | null;
    headline: string | null;
    bio: string | null;
    quote: string | null;
    location: string | null;
    avatarUrl: string | null;
    websiteUrl: string | null;
    publicProfileUrl: string | null;
  };
  leaderboard: {
    optIn: boolean;
    eligible: boolean;
    publicProfileVisible: boolean;
    rank: number | null;
    entry: {
      entryId?: string;
      rank?: number;
      displayName?: string;
      profileSlug?: string | null;
      avatarUrl?: string | null;
      iqScore: number;
      percentile: number | null;
      scoreBand: string;
      generatedAt: string;
    } | null;
  };
};

export type UpdatePublicProfileInput = {
  publicProfileEnabled?: boolean;
  displayName?: string | null;
  profileSlug?: string | null;
  headline?: string | null;
  bio?: string | null;
  quote?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
};

export const getMyPublicProfile = async () => {
  return requestApi<ConsumerPublicProfile>('/leaderboard/me/profile');
};

export const updateMyPublicProfile = async (
  input: UpdatePublicProfileInput
) => {
  return requestApi<ConsumerPublicProfile>('/leaderboard/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
};
