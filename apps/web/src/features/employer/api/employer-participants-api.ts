import { getApiBaseUrl } from '@/lib/api-base-url';
import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

export type EmployerParticipantSummary = {
  id: string;
  organisationId: string;
  userId: string;
  participantType: string;
  accessMode: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  externalReference?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  joinedAt?: string | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  organisation?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    status?: string;
  } | null;
  _count?: {
    invitations?: number;
    sessions?: number;
  };
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

export const listEmployerParticipants = async (): Promise<
  EmployerParticipantSummary[]
> => {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(`${getApiBaseUrl()}/organisation-participants`, {
    method: 'GET',
    headers: authHeaders,
    cache: 'no-store',
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : `Participant lookup failed with status ${response.status}`;

    throw new Error(message);
  }

  return Array.isArray(payload) ? (payload as EmployerParticipantSummary[]) : [];
};