import { getApiBaseUrl } from '@/lib/api-base-url';
import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

export type CandidatePendingInvitationSummary = {
  id: string;
  campaignId: string;
  email: string;
  token: string;
  status: string;
  candidateUserId?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
  usedAt?: string | null;
  campaign?: {
    id: string;
    name: string;
    organisation?: {
      id: string;
      name: string;
    } | null;
    assessmentForm?: {
      id: string;
      name: string;
      version?: number;
      versionLabel?: string | null;
    } | null;
  } | null;
};

const readResponsePayload = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

export const listCandidatePendingInvitations = async (): Promise<
  CandidatePendingInvitationSummary[]
> => {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(
    `${getApiBaseUrl()}/invitations/candidate/pending`,
    {
      method: 'GET',
      headers: authHeaders,
      cache: 'no-store',
    }
  );

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : `Candidate invitation lookup failed with status ${response.status}`;

    throw new Error(message);
  }

  return Array.isArray(payload)
    ? (payload as CandidatePendingInvitationSummary[])
    : [];
};
