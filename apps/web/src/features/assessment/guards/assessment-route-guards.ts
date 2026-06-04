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
  const safeReason = reason === 'server_error' ? 'error' : reason;

  const params = new URLSearchParams({
    reason: safeReason,
  });

  if (message) {
    params.set('message', message);
  }

  return `/assessment/status?${params.toString()}`;
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
    const session = await resumeAssessmentSession(sessionId);
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
    const session = await resumeAssessmentSession(sessionId);
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
