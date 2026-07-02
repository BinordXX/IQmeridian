import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

type CollectionResponse<T> =
  | T[]
  | {
      data?: T[];
      meta?: {
        total?: number;
      };
    };

export type EmployerInvitationSummary = {
  id: string;
  campaignId: string;
  email: string;
  token: string;
  status: string;
  candidateUserId?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
  usedAt?: string | null;
};

export type EmployerCampaignSummary = {
  id: string;
  name: string;
  status: string;
  assessmentFormId?: string | null;
  assessmentForm?: {
    id: string;
    name: string;
    version?: number;
    isActive?: boolean;
  } | null;
  invitations?: EmployerInvitationSummary[];
  createdAt?: string;
  updatedAt?: string;
};

export type EmployerCampaignDetail = Omit<
  EmployerCampaignSummary,
  'invitations'
> & {
  organisation?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  invitations?: EmployerInvitationSummary[];
  sessions?: EmployerSessionSummary[];
};

export type CreateEmployerInvitationInput = {
  campaignId: string;
  email: string;
  expiresAt?: string;
};

export type EmployerScoreSummary = {
  id: string;
  sessionId: string;
  abstractRawScore?: number;
  abstractMaxScore?: number;
  numericalRawScore?: number;
  numericalMaxScore?: number;
  overallRawScore?: number;
  overallMaxScore?: number;
  overallComposite?: number;
  abstractBand?: string;
  numericalBand?: string;
  overallBand?: string;
  domainScores?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export type EmployerResponseSummary = {
  id: string;
  sessionId: string;
  itemId: string;
  answer: unknown;
  submittedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type EmployerSessionSummary = {
  id: string;
  userId: string;
  campaignId?: string | null;
  invitationId?: string | null;
  assessmentFormId: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  candidateName?: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  invitation?: EmployerInvitationSummary | null;
  responses?: EmployerResponseSummary[];
  score?: EmployerScoreSummary | null;
};

export type EmployerDashboardData = {
  campaigns: EmployerCampaignSummary[];
  sessions: EmployerSessionSummary[];
  metrics: {
    activeCampaigns: number;
    totalCampaigns: number;
    totalInvitations: number;
    startedSessions: number;
    completedSessions: number;
    completionRate: number;
    reportReadyResults: number;
  };
};

export type EmployerAssessmentFormSummary = {
  id: string;
  name: string;
  version?: number;
  isActive?: boolean;
};

export type CreateEmployerCampaignInput = {
  name: string;
  organisationId: string;
  assessmentFormId?: string;
};

export type EmployerReportResult = {
  id: string;
  sessionId: string;
  visibility: string;
  subjectUserId?: string | null;
  scoreId?: string | null;
  reportVersion?: number;
  payload?: unknown;
  scoreSnapshot?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateEmployerCampaignStatusInput = {
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
};

const normaliseBaseUrl = (baseUrl: string): string => {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const getApiBaseUrl = (): string => {
  return normaliseBaseUrl(
    process.env.API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001'
  );
};

const getCollection = <T>(payload: CollectionResponse<T>): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.data ?? [];
};

const employerRequest = async <T>(path: string): Promise<T> => {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'GET',
    headers: authHeaders,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Employer API request failed with status ${response.status}`
    );
  }

  return (await response.json()) as T;
};

export const getEmployerDashboardData =
  async (): Promise<EmployerDashboardData> => {
    const [campaignPayload, sessionPayload] = await Promise.all([
      employerRequest<CollectionResponse<EmployerCampaignSummary>>(
        '/campaigns'
      ),
      employerRequest<CollectionResponse<EmployerSessionSummary>>('/sessions'),
    ]);

    const campaigns = getCollection(campaignPayload);
    const sessions = getCollection(sessionPayload);

    const totalInvitations = campaigns.reduce((total, campaign) => {
      return total + (campaign.invitations?.length ?? 0);
    }, 0);

    const startedSessions = sessions.filter((session) => {
      return session.status !== 'NOT_STARTED';
    }).length;

    const completedSessions = sessions.filter((session) => {
      return session.status === 'COMPLETED';
    }).length;

    const reportReadyResults = sessions.filter((session) => {
      return Boolean(session.score);
    }).length;

    return {
      campaigns,
      sessions,
      metrics: {
        activeCampaigns: campaigns.filter((campaign) => {
          return campaign.status === 'ACTIVE';
        }).length,
        totalCampaigns: campaigns.length,
        totalInvitations,
        startedSessions,
        completedSessions,
        completionRate:
          startedSessions > 0
            ? Math.round((completedSessions / startedSessions) * 100)
            : 0,
        reportReadyResults,
      },
    };
  };

export const getActiveAssessmentForms = async (): Promise<
  EmployerAssessmentFormSummary[]
> => {
  const payload = await employerRequest<
    CollectionResponse<EmployerAssessmentFormSummary>
  >('/assessments/forms/active');

  return getCollection(payload);
};

export const getEmployerCampaignById = async (
  campaignId: string
): Promise<EmployerCampaignDetail> => {
  return employerRequest<EmployerCampaignDetail>(
    `/campaigns/${encodeURIComponent(campaignId)}`
  );
};

export const createEmployerCampaign = async (
  input: CreateEmployerCampaignInput
): Promise<EmployerCampaignSummary> => {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(`${getApiBaseUrl()}/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
      error?: string;
    };

    const message = Array.isArray(payload.message)
      ? payload.message.join(' ')
      : payload.message;

    throw new Error(
      message ??
        payload.error ??
        `Campaign creation failed with status ${response.status}`,
    );
  }

  return (await response.json()) as EmployerCampaignSummary;
};

export const updateEmployerCampaignStatus = async (
  campaignId: string,
  input: UpdateEmployerCampaignStatusInput
): Promise<EmployerCampaignSummary> => {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(
    `${getApiBaseUrl()}/campaigns/${encodeURIComponent(campaignId)}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(input),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(
      `Campaign status update failed with status ${response.status}`
    );
  }

  return (await response.json()) as EmployerCampaignSummary;
};

export const createEmployerInvitation = async (
  input: CreateEmployerInvitationInput
): Promise<EmployerInvitationSummary> => {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(`${getApiBaseUrl()}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Invitation creation failed with status ${response.status}`
    );
  }

  return (await response.json()) as EmployerInvitationSummary;
};

export const generateEmployerReport = async (
  sessionId: string
): Promise<EmployerReportResult> => {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(
    `${getApiBaseUrl()}/reports/sessions/${encodeURIComponent(
      sessionId
    )}/employer`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(
      `Employer report generation failed with status ${response.status}`
    );
  }

  return (await response.json()) as EmployerReportResult;
};

export const getEmployerReportBySession = async (
  sessionId: string
): Promise<EmployerReportResult | null> => {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(
    `${getApiBaseUrl()}/reports/sessions/${encodeURIComponent(
      sessionId
    )}/EMPLOYER`,
    {
      method: 'GET',
      headers: authHeaders,
      cache: 'no-store',
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Employer report lookup failed with status ${response.status}`
    );
  }

  return (await response.json()) as EmployerReportResult;
};
