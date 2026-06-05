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
  candidateUserId?: string;
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
  };
};

const normaliseBaseUrl = (baseUrl: string): string => {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const getApiBaseUrl = (): string => {
  return normaliseBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001'
  );
};

const getEmployerAuthHeader = (): string => {
  return process.env.EMPLOYER_API_TOKEN ?? 'Bearer employer-token';
};

const getCollection = <T>(payload: CollectionResponse<T>): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.data ?? [];
};

const employerRequest = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'GET',
    headers: {
      Authorization: getEmployerAuthHeader(),
      'Content-Type': 'application/json',
    },
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

    return {
      campaigns,
      sessions,
      metrics: {
        activeCampaigns: campaigns.filter(
          (campaign) => campaign.status === 'ACTIVE'
        ).length,
        totalCampaigns: campaigns.length,
        totalInvitations,
        startedSessions,
        completedSessions,
        completionRate:
          startedSessions > 0
            ? Math.round((completedSessions / startedSessions) * 100)
            : 0,
      },
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

export type UpdateEmployerCampaignStatusInput = {
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
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
  const response = await fetch(`${getApiBaseUrl()}/campaigns`, {
    method: 'POST',
    headers: {
      Authorization: getEmployerAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Campaign creation failed with status ${response.status}`);
  }

  return (await response.json()) as EmployerCampaignSummary;
};

export const updateEmployerCampaignStatus = async (
  campaignId: string,
  input: UpdateEmployerCampaignStatusInput
): Promise<EmployerCampaignSummary> => {
  const response = await fetch(
    `${getApiBaseUrl()}/campaigns/${encodeURIComponent(campaignId)}/status`,
    {
      method: 'PATCH',
      headers: {
        Authorization: getEmployerAuthHeader(),
        'Content-Type': 'application/json',
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
  const response = await fetch(`${getApiBaseUrl()}/invitations`, {
    method: 'POST',
    headers: {
      Authorization: getEmployerAuthHeader(),
      'Content-Type': 'application/json',
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
