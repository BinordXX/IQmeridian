import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';

import { AssessmentApiError } from '../api/assessment-api';
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

const loginPathForInvitation = (token: string) => {
  const callbackUrl = `/assessment/invitation/${encodeURIComponent(
    token,
  )}/instructions`;

  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
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

const mapBackendInvitationValidation = (
  invitation: BackendInvitationValidationResult,
): InvitationValidationResult => {
  if (invitation.status === 'PENDING' || invitation.status === 'ACCEPTED') {
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
          }),
        ) ?? [],
    } as InvitationValidationResult;
  }

  if (invitation.status === 'EXPIRED') {
    return {
      status: 'expired',
      message: 'This invitation has expired.',
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
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

export const guardInvitationInstructionsRoute = async (
  token: string,
): Promise<AssessmentGuardDecision<InvitationValidationResult>> => {
  const session = await auth();
  const role = session?.user?.role;
  const userEmail = session?.user?.email?.trim().toLowerCase() ?? null;

  if (!session?.user) {
    return {
      allowed: false,
      reason: 'unauthorised',
      redirectTo: loginPathForInvitation(token),
    };
  }

  if (role !== 'CANDIDATE') {
    return {
      allowed: false,
      reason: 'unauthorised',
      redirectTo: statusPath(
        'unauthorised',
        'Sign out and open this invitation with the candidate account assigned to the invitation.',
      ),
    };
  }

  try {
    const invitation =
      await serverAssessmentRequest<BackendInvitationValidationResult>(
        `/invitations/validate/${encodeURIComponent(token)}`,
      );

    if (
      userEmail &&
      invitation.email.trim().toLowerCase() !== userEmail
    ) {
      return {
        allowed: false,
        reason: 'unauthorised',
        redirectTo: statusPath(
          'unauthorised',
          'This invitation belongs to a different candidate email address.',
        ),
      };
    }

    if (
      invitation.candidateUserId &&
      invitation.candidateUserId !== session.user.id
    ) {
      return {
        allowed: false,
        reason: 'unauthorised',
        redirectTo: statusPath(
          'unauthorised',
          'This invitation has already been claimed by another candidate account.',
        ),
      };
    }

    const validation = mapBackendInvitationValidation(invitation);

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
