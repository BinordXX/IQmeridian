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
  scoreBand: string;
  standardError: number | null;
  ci90Lower: number | null;
  ci90Upper: number | null;
  testInformation: number | null;
  reliability: number | null;
  interpretation: string;
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

  return response.json() as Promise<T>;
};

const normaliseSessions = (
  response: SessionsListResponse
): ConsumerSessionSummary[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.sessions)) return response.sessions;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;

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
      } catch {
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
