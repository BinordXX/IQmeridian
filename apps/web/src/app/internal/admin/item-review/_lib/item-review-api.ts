import { getApiBaseUrl } from '@/lib/api-url';
import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

export type InternalUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status?: string;
};

export type ReviewQueueItem = {
  id: string;
  domain: string;
  prompt: string;
  stimulus: unknown;
  itemType: string;
  options: unknown;
  correctAnswer: unknown;
  scoringRule: string;
  difficulty: string | null;
  intendedDifficulty: string | null;
  status: string;
  reviewStatus: string;
  psychometricStatus: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  revisionRequestReason: string | null;
  createdAt: string;
  updatedAt: string;
  assignedForm: {
    id: string;
    name: string;
    version: number;
    versionLabel: string | null;
    formStatus: string;
    isActive: boolean;
  } | null;
  assignedSection: {
    id: string;
    title: string;
    domain: string;
    type: string;
  } | null;
  sourceAssignment: {
    id: string;
    researcher: InternalUser;
  } | null;
  createdByUser: InternalUser | null;
  submittedByUser: InternalUser | null;
  reviewedByUser: InternalUser | null;
  approvedByUser: InternalUser | null;
  formMappings: Array<{
    id: string;
    status: string;
    orderIndex: number;
    form: {
      id: string;
      name: string;
      version: number;
      versionLabel: string | null;
    };
    section: {
      id: string;
      title: string;
      domain: string;
    } | null;
  }>;
};

const getErrorMessage = async (response: Response, fallback: string) => {
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
    error?: string;
  };

  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }

  return payload.message ?? payload.error ?? fallback;
};

async function internalApiFetch<T>(
  path: string,
  init?: RequestInit,
  fallback = 'Internal API request failed.'
) {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...authHeaders,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallback));
  }

  return (await response.json()) as T;
}

export async function fetchReviewQueueItems() {
  return internalApiFetch<ReviewQueueItem[]>(
    '/assessments/forms/items/review-queue',
    undefined,
    'Unable to load review queue.'
  );
}

export async function startItemReview(
  itemId: string,
  input: {
    reviewNotes?: string | null;
  }
) {
  return internalApiFetch<ReviewQueueItem>(
    `/assessments/forms/items/${encodeURIComponent(itemId)}/review/start`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    'Unable to start item review.'
  );
}

export async function requestItemChanges(
  itemId: string,
  input: {
    reviewNotes?: string | null;
    reason?: string | null;
  }
) {
  return internalApiFetch<ReviewQueueItem>(
    `/assessments/forms/items/${encodeURIComponent(
      itemId
    )}/review/request-changes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    'Unable to request item changes.'
  );
}

export async function rejectItem(
  itemId: string,
  input: {
    reviewNotes?: string | null;
    reason?: string | null;
  }
) {
  return internalApiFetch<ReviewQueueItem>(
    `/assessments/forms/items/${encodeURIComponent(itemId)}/review/reject`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    'Unable to reject item.'
  );
}

export async function approveItem(
  itemId: string,
  input: {
    reviewNotes?: string | null;
    activate?: boolean;
    orderIndex?: number | null;
  }
) {
  return internalApiFetch<{
    item: ReviewQueueItem;
    mapping: unknown;
  }>(
    `/assessments/forms/items/${encodeURIComponent(itemId)}/review/approve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    'Unable to approve item.'
  );
}
