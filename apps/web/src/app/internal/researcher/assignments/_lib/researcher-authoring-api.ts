import { getApiBaseUrl } from '@/lib/api-url';
import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

export type InternalUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status?: string;
};

export type ResearcherAssignment = {
  id: string;
  formId: string;
  sectionId: string;
  researcherId: string;
  assignedByAdminId: string;
  targetItemCount: number;
  status: string;
  notes: string | null;
  dueAt: string | null;
  assignedAt: string;
  completedAt: string | null;
  form: {
    id: string;
    name: string;
    version: number;
    versionLabel: string | null;
    formStatus: string;
    isActive: boolean;
    targetBankItemCount: number;
    deliveryItemCount: number;
  };
  section: {
    id: string;
    formId: string;
    type: string;
    domain: string;
    title: string;
    orderIndex: number;
    timeLimitSec: number;
    targetBankItemCount: number;
    deliveryItemCount: number;
  };
  assignedByAdmin: InternalUser;
  _count?: {
    items: number;
    reviewEvents: number;
  };
};

export type AssignmentItem = {
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
  rejectionReason: string | null;
  revisionRequestReason: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  reviewEvents: Array<{
    id: string;
    action: string;
    fromStatus: string | null;
    toStatus: string | null;
    notes: string | null;
    createdAt: string;
    actor: InternalUser;
  }>;
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

export type AssignmentItemsResponse = {
  assignment: ResearcherAssignment;
  items: AssignmentItem[];
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

export async function fetchMyResearcherAssignments() {
  return internalApiFetch<ResearcherAssignment[]>(
    '/assessments/forms/section-assignments/mine',
    undefined,
    'Unable to load researcher assignments.'
  );
}

export async function fetchAssignmentItems(assignmentId: string) {
  return internalApiFetch<AssignmentItemsResponse>(
    `/assessments/forms/section-assignments/${encodeURIComponent(
      assignmentId
    )}/items`,
    undefined,
    'Unable to load assignment items.'
  );
}

export async function createAssignmentItem(
  assignmentId: string,
  input: {
    prompt: string;
    stimulus?: unknown;
    itemType: string;
    options?: unknown;
    correctAnswer?: unknown;
    scoringRule?: string;
    difficulty?: string | null;
    intendedDifficulty?: string | null;
    estimatedResponseTimeSec?: number | null;
    cognitiveProcess?: string | null;
    itemRationale?: string | null;
    distractorRationale?: unknown;
  }
) {
  return internalApiFetch<AssignmentItem>(
    `/assessments/forms/section-assignments/${encodeURIComponent(
      assignmentId
    )}/items`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    'Unable to create item.'
  );
}

export async function submitAssignmentItem(
  assignmentId: string,
  itemId: string
) {
  return internalApiFetch<AssignmentItem>(
    `/assessments/forms/section-assignments/${encodeURIComponent(
      assignmentId
    )}/items/${encodeURIComponent(itemId)}/submit`,
    {
      method: 'POST',
    },
    'Unable to submit item for review.'
  );
}
