import {
  assertCandidateSafeAssessmentPayload,
  type AssessmentReportResult,
  type AssessmentResponsesResult,
  type AssessmentScoreResult,
  type AssessmentSessionPayload,
  type CreateAssessmentSessionInput,
  type CreateAssessmentSessionResult,
  type FinaliseAssessmentSessionResult,
  type GenerateAssessmentReportResult,
  type InvitationValidationResult,
  type SaveAssessmentResponseInput,
  type SaveAssessmentResponseResult,
} from '../contracts/assessment-contracts';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type AssessmentRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
};

type BackendInvitationValidationResult = {
  id: string;
  campaignId: string;
  email: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  candidateUserId?: string | null;
  expiresAt?: string | null;
  campaign?: {
    name?: string;
    assessmentForm?: {
      name?: string;
      sections?: Array<{
        id: string;
        title: string;
        instructions?: string | null;
        orderIndex?: number | null;
        position?: number | null;
        itemCount?: number | null;
        timeLimitSec?: number | null;
        items?: unknown[];
        _count?: {
          items?: number;
          formItemMappings?: number;
        };
      }>;
    } | null;
  } | null;
  candidateUser?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

type BackendSavedAssessmentResponse = {
  id: string;
  sessionId: string;
  itemId: string;
  answer: unknown;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackendCreateAssessmentSessionResult = {
  id?: string;
  sessionId?: string;
  userId?: string;
  campaignId?: string | null;
  invitationId?: string | null;
  assessmentFormId?: string;
  assessmentId?: string;
  status?: string;
};

export class AssessmentApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'AssessmentApiError';
    this.status = status;
    this.payload = payload;
  }
}

const normaliseBaseUrl = (baseUrl: string): string => {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const assessmentApiBaseUrl = normaliseBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001'
);

const assessmentEndpoints = {
  validateInvitation: (token: string) =>
    `/invitations/validate/${encodeURIComponent(token)}`,

  createSession: '/sessions/invitation',

  startSession: (sessionId: string) =>
    `/sessions/${encodeURIComponent(sessionId)}/start`,

  resumeSession: (sessionId: string) =>
    `/sessions/${encodeURIComponent(sessionId)}/resume`,

  syncSessionState: (sessionId: string) =>
    `/sessions/${encodeURIComponent(sessionId)}/state`,

  saveResponse: (sessionId: string, itemId: string) =>
    `/responses/sessions/${encodeURIComponent(
      sessionId
    )}/items/${encodeURIComponent(itemId)}`,

  getResponses: (sessionId: string) =>
    `/responses/sessions/${encodeURIComponent(sessionId)}`,

  finaliseSession: (sessionId: string) =>
    `/sessions/${encodeURIComponent(sessionId)}/finalise`,

  scoreSession: (sessionId: string) =>
    `/sessions/${encodeURIComponent(sessionId)}/score`,

  generateReport: (sessionId: string) =>
    `/sessions/${encodeURIComponent(sessionId)}/report`,

  getReport: (reportId: string) => `/reports/${encodeURIComponent(reportId)}`,
};

const readResponsePayload = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const assessmentRequest = async <T>(
  path: string,
  options: AssessmentRequestOptions = {}
): Promise<T> => {
  const response = await fetch(`${assessmentApiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer candidate-token',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'include',
    cache: 'no-store',
    signal: options.signal,
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new AssessmentApiError(
      `Assessment API request failed with status ${response.status}.`,
      response.status,
      payload
    );
  }

  return payload as T;
};

export const validateInvitation = async (
  token: string,
  signal?: AbortSignal
): Promise<InvitationValidationResult> => {
  const invitation = await assessmentRequest<BackendInvitationValidationResult>(
    assessmentEndpoints.validateInvitation(token),
    { signal }
  );

  if (invitation.status === 'PENDING') {
    return {
      status: 'valid',
      token: invitation.token,
      invitationId: invitation.id,
      invitationToken: invitation.token,
      campaignId: invitation.campaignId,
      candidateName:
        invitation.candidateUser?.name ?? invitation.email ?? undefined,
      assessmentTitle:
        invitation.campaign?.assessmentForm?.name ??
        invitation.campaign?.name ??
        'Candidate assessment',
      sections:
        invitation.campaign?.assessmentForm?.sections?.map(
          (section, index) => ({
            sectionId: section.id,
            title: section.title,
            instructions: section.instructions ?? null,
            position: section.position ?? section.orderIndex ?? index + 1,
            itemCount:
              section.itemCount ??
              section._count?.items ??
              section._count?.formItemMappings ??
              section.items?.length ??
              0,
            timeLimitSec: section.timeLimitSec ?? undefined,
          })
        ) ?? [],
    } as InvitationValidationResult;
  }

  if (invitation.status === 'EXPIRED') {
    return {
      status: 'expired',
      message: 'This invitation has expired.',
    } as InvitationValidationResult;
  }

  if (invitation.status === 'ACCEPTED') {
    return {
      status: 'used',
      message: 'This invitation has already been used.',
    } as InvitationValidationResult;
  }

  if (invitation.status === 'CANCELLED') {
    return {
      status: 'cancelled',
      message: 'This invitation has been cancelled.',
    } as InvitationValidationResult;
  }

  return {
    status: 'invalid',
    message: 'This invitation is not valid.',
  } as InvitationValidationResult;
};

export const createAssessmentSession = async (
  input: CreateAssessmentSessionInput,
  signal?: AbortSignal
): Promise<CreateAssessmentSessionResult> => {
  const session = await assessmentRequest<BackendCreateAssessmentSessionResult>(
    assessmentEndpoints.createSession,
    {
      method: 'POST',
      body: input,
      signal,
    }
  );

  const sessionId = session.sessionId ?? session.id;

  if (!sessionId) {
    throw new AssessmentApiError(
      'Assessment session creation did not return a session id.',
      500,
      session
    );
  }

  return {
    sessionId,
    assessmentId: session.assessmentId ?? session.assessmentFormId ?? '',
    status:
      session.status === 'IN_PROGRESS'
        ? 'active'
        : session.status === 'NOT_STARTED'
          ? 'not_started'
          : 'not_started',
  };
};

export const startAssessmentSession = async (
  sessionId: string,
  signal?: AbortSignal
): Promise<AssessmentSessionPayload> => {
  const payload = await assessmentRequest<AssessmentSessionPayload>(
    assessmentEndpoints.startSession(sessionId),
    {
      method: 'POST',
      signal,
    }
  );

  assertCandidateSafeAssessmentPayload(payload);

  return payload;
};

export const resumeAssessmentSession = async (
  sessionId: string,
  signal?: AbortSignal
): Promise<AssessmentSessionPayload> => {
  const payload = await assessmentRequest<AssessmentSessionPayload>(
    assessmentEndpoints.resumeSession(sessionId),
    {
      method: 'POST',
      signal,
    }
  );

  assertCandidateSafeAssessmentPayload(payload);

  return payload;
};

export const syncAssessmentSessionState = async (
  sessionId: string,
  signal?: AbortSignal
): Promise<AssessmentSessionPayload> => {
  const payload = await assessmentRequest<AssessmentSessionPayload>(
    assessmentEndpoints.syncSessionState(sessionId),
    {
      signal,
    }
  );

  assertCandidateSafeAssessmentPayload(payload);

  return payload;
};

export const saveAssessmentResponse = async (
  sessionId: string,
  input: SaveAssessmentResponseInput,
  signal?: AbortSignal
): Promise<SaveAssessmentResponseResult> => {
  const saved = await assessmentRequest<BackendSavedAssessmentResponse>(
    assessmentEndpoints.saveResponse(sessionId, input.itemId),
    {
      method: 'POST',
      body: {
        answer: input.responseValue,
      },
      signal,
    }
  );

  return {
    sessionId: saved.sessionId,
    status: 'saved',
    response: {
      sectionId: input.sectionId,
      itemId: saved.itemId,
      responseValue:
        saved.answer as SaveAssessmentResponseResult['response']['responseValue'],
      savedAt: saved.updatedAt ?? saved.createdAt,
    },
  };
};

export const getAssessmentResponses = async (
  sessionId: string,
  signal?: AbortSignal
): Promise<AssessmentResponsesResult> => {
  const responses = await assessmentRequest<BackendSavedAssessmentResponse[]>(
    assessmentEndpoints.getResponses(sessionId),
    { signal }
  );

  return {
    sessionId,
    responses: responses.map((response) => ({
      sectionId: '',
      itemId: response.itemId,
      responseValue:
        response.answer as AssessmentResponsesResult['responses'][number]['responseValue'],
      savedAt: response.updatedAt ?? response.createdAt,
    })),
  };
};

export const finaliseAssessmentSession = async (
  sessionId: string,
  signal?: AbortSignal
): Promise<FinaliseAssessmentSessionResult> => {
  return assessmentRequest<FinaliseAssessmentSessionResult>(
    assessmentEndpoints.finaliseSession(sessionId),
    {
      method: 'POST',
      signal,
    }
  );
};

export const scoreAssessmentSession = async (
  sessionId: string,
  signal?: AbortSignal
): Promise<AssessmentScoreResult> => {
  return assessmentRequest<AssessmentScoreResult>(
    assessmentEndpoints.scoreSession(sessionId),
    {
      method: 'POST',
      signal,
    }
  );
};

export const generateAssessmentReport = async (
  sessionId: string,
  signal?: AbortSignal
): Promise<GenerateAssessmentReportResult> => {
  return assessmentRequest<GenerateAssessmentReportResult>(
    assessmentEndpoints.generateReport(sessionId),
    {
      method: 'POST',
      signal,
    }
  );
};

export const getAssessmentReport = async (
  reportId: string,
  signal?: AbortSignal
): Promise<AssessmentReportResult> => {
  return assessmentRequest<AssessmentReportResult>(
    assessmentEndpoints.getReport(reportId),
    { signal }
  );
};
