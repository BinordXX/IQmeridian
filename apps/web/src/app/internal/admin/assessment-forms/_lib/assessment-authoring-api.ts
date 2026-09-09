import { getApiBaseUrl } from '@/lib/api-url';
import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

export type AssessmentFormStatus = 'DRAFT' | 'INTERNAL' | 'PUBLIC' | 'ARCHIVED';

export type AssessmentDomain =
  | 'VERBAL_REASONING'
  | 'NUMERICAL_REASONING'
  | 'ABSTRACT_REASONING'
  | 'LOGICAL_REASONING'
  | 'ANALYTICAL_PROBLEM_SOLVING'
  | 'SPATIAL_REASONING';

export type AssessmentSectionType =
  | 'VERBAL'
  | 'NUMERICAL'
  | 'ABSTRACT'
  | 'LOGICAL'
  | 'ANALYTICAL'
  | 'SPATIAL';

export type InternalUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status?: string;
};

export type AssessmentSection = {
  id: string;
  formId: string;
  type: AssessmentSectionType;
  domain: AssessmentDomain;
  title: string;
  orderIndex: number;
  timeLimitSec: number;
  targetBankItemCount: number;
  deliveryItemCount: number;
};

export type AssessmentForm = {
  id: string;
  name: string;
  version: number;
  versionLabel: string | null;
  description: string | null;
  isActive: boolean;
  formStatus: AssessmentFormStatus;
  targetBankItemCount: number;
  deliveryItemCount: number;
  randomizeItems: boolean;
  randomizeOptions: boolean;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sections: AssessmentSection[];
  items: Array<{
    id: string;
    status: string;
    orderIndex: number;
    sectionId: string | null;
    itemId: string;
    item: {
      id: string;
      prompt: string;
      status: string;
      reviewStatus: string;
      domain: AssessmentDomain;
      intendedDifficulty: string | null;
    };
    section: AssessmentSection | null;
  }>;
  createdByAdmin?: InternalUser | null;
  publishedByAdmin?: InternalUser | null;
  _count?: {
    sections: number;
    items: number;
    sectionAssignments: number;
    sessions: number;
  };
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
  researcher: InternalUser;
  assignedByAdmin: InternalUser;
  _count?: {
    items: number;
    reviewEvents: number;
  };
};

export type ResearcherListResponse =
  | InternalUser[]
  | {
      data?: InternalUser[];
      users?: InternalUser[];
      items?: InternalUser[];
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

export async function internalApiFetch<T>(
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

export async function fetchAssessmentForms(status?: string) {
  const path = status
    ? `/assessments/forms?status=${encodeURIComponent(status)}`
    : '/assessments/forms';

  return internalApiFetch<AssessmentForm[]>(
    path,
    undefined,
    'Unable to load assessment forms.'
  );
}

export async function fetchAssessmentForm(formId: string) {
  return internalApiFetch<AssessmentForm>(
    `/assessments/forms/${encodeURIComponent(formId)}`,
    undefined,
    'Unable to load assessment form.'
  );
}

export async function fetchResearchers() {
  const response = await internalApiFetch<ResearcherListResponse>(
    '/users?role=RESEARCHER&limit=100',
    undefined,
    'Unable to load researchers.'
  );

  if (Array.isArray(response)) {
    return response;
  }

  return response.data ?? response.users ?? response.items ?? [];
}

export async function fetchSectionAssignments(
  formId: string,
  sectionId: string
) {
  return internalApiFetch<ResearcherAssignment[]>(
    `/assessments/forms/${encodeURIComponent(
      formId
    )}/sections/${encodeURIComponent(sectionId)}/researcher-assignments`,
    undefined,
    'Unable to load section assignments.'
  );
}

export async function createAssessmentForm(input: unknown) {
  return internalApiFetch<AssessmentForm>(
    '/assessments/forms',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    'Unable to create assessment form.'
  );
}

export async function updateAssessmentFormPublication(
  formId: string,
  formStatus: AssessmentFormStatus
) {
  return internalApiFetch<AssessmentForm>(
    `/assessments/forms/${encodeURIComponent(formId)}/publication`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ formStatus }),
    },
    'Unable to update assessment form publication status.'
  );
}

export async function assignResearcherToSection(input: {
  formId: string;
  sectionId: string;
  researcherId: string;
  targetItemCount: number;
  notes?: string | null;
  dueAt?: string | null;
}) {
  return internalApiFetch<ResearcherAssignment>(
    `/assessments/forms/${encodeURIComponent(
      input.formId
    )}/sections/${encodeURIComponent(input.sectionId)}/researcher-assignments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        researcherId: input.researcherId,
        targetItemCount: input.targetItemCount,
        notes: input.notes,
        dueAt: input.dueAt,
      }),
    },
    'Unable to assign researcher to section.'
  );
}
