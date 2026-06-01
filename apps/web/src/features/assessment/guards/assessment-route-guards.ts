import {
  AssessmentApiError,
  resumeAssessmentSession,
  validateInvitation,
} from '../api/assessment-api';
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

const statusPath = (
  reason: AssessmentGuardReason,
  message?: string
): string => {
  const params = new URLSearchParams({
    reason,
  });

  if (message) {
    params.set('message', message);
  }

  return `/assessment/status?${params.toString()}`;
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
    const session = await resumeAssessmentSession(sessionId);

    if (session.status === 'completed' || session.status === 'submitted') {
      return {
        allowed: false,
        reason: 'completed',
        redirectTo: statusPath('completed'),
      };
    }

    if (session.status === 'expired') {
      return {
        allowed: false,
        reason: 'expired',
        redirectTo: statusPath('expired'),
      };
    }

    if (session.status === 'cancelled') {
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
    const session = await resumeAssessmentSession(sessionId);

    if (session.status === 'active' || session.status === 'section_ended') {
      return {
        allowed: true,
        data: session,
      };
    }

    if (session.status === 'not_started' || session.status === 'ready') {
      return {
        allowed: false,
        reason: 'invalid',
        redirectTo: `/assessment/session/${encodeURIComponent(
          sessionId
        )}/instructions`,
      };
    }

    if (session.status === 'completed' || session.status === 'submitted') {
      return {
        allowed: false,
        reason: 'completed',
        redirectTo: statusPath('completed'),
      };
    }

    if (session.status === 'expired') {
      return {
        allowed: false,
        reason: 'expired',
        redirectTo: statusPath('expired'),
      };
    }

    if (session.status === 'cancelled') {
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
