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
} from "../contracts/assessment-contracts";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type AssessmentRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
};

export class AssessmentApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "AssessmentApiError";
    this.status = status;
    this.payload = payload;
  }
}

const normaliseBaseUrl = (baseUrl: string): string => {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const assessmentApiBaseUrl = normaliseBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001",
);

const assessmentEndpoints = {
  validateInvitation: (token: string) =>
    `/assessment/invitations/${encodeURIComponent(token)}/validate`,

  createSession: "/assessment/sessions",

  startSession: (sessionId: string) =>
    `/assessment/sessions/${encodeURIComponent(sessionId)}/start`,

  resumeSession: (sessionId: string) =>
    `/assessment/sessions/${encodeURIComponent(sessionId)}/resume`,

  saveResponse: (sessionId: string) =>
    `/assessment/sessions/${encodeURIComponent(sessionId)}/responses`,

  getResponses: (sessionId: string) =>
    `/assessment/sessions/${encodeURIComponent(sessionId)}/responses`,

  finaliseSession: (sessionId: string) =>
    `/assessment/sessions/${encodeURIComponent(sessionId)}/finalise`,

  scoreSession: (sessionId: string) =>
    `/assessment/sessions/${encodeURIComponent(sessionId)}/score`,

  generateReport: (sessionId: string) =>
    `/assessment/sessions/${encodeURIComponent(sessionId)}/report`,

  getReport: (reportId: string) =>
    `/assessment/reports/${encodeURIComponent(reportId)}`,
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
  options: AssessmentRequestOptions = {},
): Promise<T> => {
  const response = await fetch(`${assessmentApiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "include",
    cache: "no-store",
    signal: options.signal,
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new AssessmentApiError(
      `Assessment API request failed with status ${response.status}.`,
      response.status,
      payload,
    );
  }

  return payload as T;
};

export const validateInvitation = async (
  token: string,
  signal?: AbortSignal,
): Promise<InvitationValidationResult> => {
  return assessmentRequest<InvitationValidationResult>(
    assessmentEndpoints.validateInvitation(token),
    { signal },
  );
};

export const createAssessmentSession = async (
  input: CreateAssessmentSessionInput,
  signal?: AbortSignal,
): Promise<CreateAssessmentSessionResult> => {
  return assessmentRequest<CreateAssessmentSessionResult>(
    assessmentEndpoints.createSession,
    {
      method: "POST",
      body: input,
      signal,
    },
  );
};

export const startAssessmentSession = async (
  sessionId: string,
  signal?: AbortSignal,
): Promise<AssessmentSessionPayload> => {
  const payload = await assessmentRequest<AssessmentSessionPayload>(
    assessmentEndpoints.startSession(sessionId),
    {
      method: "POST",
      signal,
    },
  );

  assertCandidateSafeAssessmentPayload(payload);

  return payload;
};

export const resumeAssessmentSession = async (
  sessionId: string,
  signal?: AbortSignal,
): Promise<AssessmentSessionPayload> => {
  const payload = await assessmentRequest<AssessmentSessionPayload>(
    assessmentEndpoints.resumeSession(sessionId),
    {
      method: "POST",
      signal,
    },
  );

  assertCandidateSafeAssessmentPayload(payload);

  return payload;
};

export const saveAssessmentResponse = async (
  sessionId: string,
  input: SaveAssessmentResponseInput,
  signal?: AbortSignal,
): Promise<SaveAssessmentResponseResult> => {
  return assessmentRequest<SaveAssessmentResponseResult>(
    assessmentEndpoints.saveResponse(sessionId),
    {
      method: "PUT",
      body: input,
      signal,
    },
  );
};

export const getAssessmentResponses = async (
  sessionId: string,
  signal?: AbortSignal,
): Promise<AssessmentResponsesResult> => {
  return assessmentRequest<AssessmentResponsesResult>(
    assessmentEndpoints.getResponses(sessionId),
    { signal },
  );
};

export const finaliseAssessmentSession = async (
  sessionId: string,
  signal?: AbortSignal,
): Promise<FinaliseAssessmentSessionResult> => {
  return assessmentRequest<FinaliseAssessmentSessionResult>(
    assessmentEndpoints.finaliseSession(sessionId),
    {
      method: "POST",
      signal,
    },
  );
};

export const scoreAssessmentSession = async (
  sessionId: string,
  signal?: AbortSignal,
): Promise<AssessmentScoreResult> => {
  return assessmentRequest<AssessmentScoreResult>(
    assessmentEndpoints.scoreSession(sessionId),
    {
      method: "POST",
      signal,
    },
  );
};

export const generateAssessmentReport = async (
  sessionId: string,
  signal?: AbortSignal,
): Promise<GenerateAssessmentReportResult> => {
  return assessmentRequest<GenerateAssessmentReportResult>(
    assessmentEndpoints.generateReport(sessionId),
    {
      method: "POST",
      signal,
    },
  );
};

export const getAssessmentReport = async (
  reportId: string,
  signal?: AbortSignal,
): Promise<AssessmentReportResult> => {
  return assessmentRequest<AssessmentReportResult>(
    assessmentEndpoints.getReport(reportId),
    { signal },
  );
};