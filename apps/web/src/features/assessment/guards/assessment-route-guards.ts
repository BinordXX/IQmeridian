import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';

import { AssessmentApiError, validateInvitation } from '../api/assessment-api';
import type {
  AssessmentSessionPayload,
  InvitationValidationResult,
} from '../contracts/assessment-contracts';

export type AssessmentGuardReason =
  | 'invalid'
  | 'expired'
  | 'completed'
  | 'unauthorised'
  | 'cancelled'
  | 'server_error';

export type AssessmentGuardDecision<T> =
  | {
      allowed: true;
      data: T;
    }
  | {
      allowed: false;
      reason: AssessmentGuardReason;
      redirectTo: string;
    };

type ServerAssessmentRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
};

const normaliseBaseUrl = (baseUrl: string) => {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const statusPath = (
  reason: AssessmentGuardReason,
  message?: string
): string => {
  const safeReason = reason === 'server_error' ? 'error' : reason;

  const params = new URLSearchParams({
    reason: safeReason,
  });

  if (message) {
    params.set('message', message);
  }

  return `/assessment/status?${params.toString()}`;
};

const readResponsePayload = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const serverAssessmentRequest = async <T>(
  path: string,
  options: ServerAssessmentRequestOptions = {}
): Promise<T> => {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    throw new AssessmentApiError('Authentication is required.', 401, null);
  }

  const response = await fetch(`${normaliseBaseUrl(getApiBaseUrl())}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
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

const resumeAssessmentSessionForGuard = async (sessionId: string) => {
  return serverAssessmentRequest<AssessmentSessionPayload>(
    `/sessions/${encodeURIComponent(sessionId)}/resume`,
    {
      method: 'POST',
    }
  );
};

const normaliseSessionStatus = (status?: string): string => {
  return status?.toLowerCase() ?? 'unknown';
};

const isCompletedStatus = (status: string): boolean => {
  return status === 'completed' || status === 'submitted';
};

const isExpiredStatus = (status: string): boolean => {
  return status === 'expired';
};

const isCancelledStatus = (status: string): boolean => {
  return status === 'cancelled';
};

const isInstructionStatus = (status: string): boolean => {
  return status === 'not_started' || status === 'ready';
};

const isLiveStatus = (status: string): boolean => {
  return (
    status === 'active' ||
    status === 'in_progress' ||
    status === 'section_ended'
  );
};

const apiErrorToGuardDecision = <T>(
  error: unknown
): AssessmentGuardDecision<T> => {
  if (error instanceof AssessmentApiError) {
    if (error.status === 401 || error.status === 403) {
      return {
        allowed: false,
        reason: 'unauthorised',
        redirectTo: statusPath('unauthorised'),
      };
    }

    if (error.status === 404) {
      return {
        allowed: false,
        reason: 'invalid',
        redirectTo: statusPath('invalid'),
      };
    }
  }

  return {
    allowed: false,
    reason: 'server_error',
    redirectTo: statusPath('server_error'),
  };
};

export const guardInvitationInstructionsRoute = async (
  token: string
): Promise<AssessmentGuardDecision<InvitationValidationResult>> => {
  try {
    const validation = await validateInvitation(token);

    if (validation.status === 'valid') {
      return {
        allowed: true,
        data: validation,
      };
    }

    if (validation.status === 'expired') {
      return {
        allowed: false,
        reason: 'expired',
        redirectTo: statusPath('expired', validation.message),
      };
    }

    if (validation.status === 'used') {
      return {
        allowed: false,
        reason: 'completed',
        redirectTo: statusPath('completed', validation.message),
      };
    }

    if (validation.status === 'cancelled') {
      return {
        allowed: false,
        reason: 'cancelled',
        redirectTo: statusPath('cancelled', validation.message),
      };
    }

    return {
      allowed: false,
      reason: 'invalid',
      redirectTo: statusPath('invalid', validation.message),
    };
  } catch (error) {
    return apiErrorToGuardDecision(error);
  }
};

export const guardSessionInstructionsRoute = async (
  sessionId: string
): Promise<AssessmentGuardDecision<AssessmentSessionPayload>> => {
  try {
    const session = await resumeAssessmentSessionForGuard(sessionId);
    const status = normaliseSessionStatus(session.status);

    if (isCompletedStatus(status)) {
      return {
        allowed: false,
        reason: 'completed',
        redirectTo: statusPath('completed'),
      };
    }

    if (isExpiredStatus(status)) {
      return {
        allowed: false,
        reason: 'expired',
        redirectTo: statusPath('expired'),
      };
    }

    if (isCancelledStatus(status)) {
      return {
        allowed: false,
        reason: 'cancelled',
        redirectTo: statusPath('cancelled'),
      };
    }

    return {
      allowed: true,
      data: session,
    };
  } catch (error) {
    return apiErrorToGuardDecision(error);
  }
};

export const guardLiveAssessmentRoute = async (
  sessionId: string
): Promise<AssessmentGuardDecision<AssessmentSessionPayload>> => {
  try {
    const session = await resumeAssessmentSessionForGuard(sessionId);
    const status = normaliseSessionStatus(session.status);

    if (isLiveStatus(status)) {
      return {
        allowed: true,
        data: session,
      };
    }

    if (isInstructionStatus(status)) {
      return {
        allowed: false,
        reason: 'invalid',
        redirectTo: `/assessment/session/${encodeURIComponent(
          sessionId
        )}/instructions`,
      };
    }

    if (isCompletedStatus(status)) {
      return {
        allowed: false,
        reason: 'completed',
        redirectTo: statusPath('completed'),
      };
    }

    if (isExpiredStatus(status)) {
      return {
        allowed: false,
        reason: 'expired',
        redirectTo: statusPath('expired'),
      };
    }

    if (isCancelledStatus(status)) {
      return {
        allowed: false,
        reason: 'cancelled',
        redirectTo: statusPath('cancelled'),
      };
    }

    return {
      allowed: false,
      reason: 'invalid',
      redirectTo: statusPath('invalid'),
    };
  } catch (error) {
    return apiErrorToGuardDecision(error);
  }
};
