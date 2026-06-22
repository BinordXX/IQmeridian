import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

type CollectionResponse<T> =
  | T[]
  | {
      data?: T[];
      meta?: {
        total?: number;
        page?: number;
        limit?: number;
        pageCount?: number;
      };
    };

export type InternalAuditLogSummary = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  metadata?: unknown;
  createdAt?: string;
};

export type InternalSessionSummary = {
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
  responses?: unknown[];
  score?: unknown | null;
};

export type InternalReportSummary = {
  id: string;
  sessionId: string;
  visibility: string;
  subjectUserId?: string | null;
  scoreId?: string | null;
  reportVersion?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type InternalOperationalData = {
  auditLogs: InternalAuditLogSummary[];
  sessions: InternalSessionSummary[];
  reports: InternalReportSummary[];
  metrics: {
    auditLogCount: number;
    sessionCount: number;
    completedSessionCount: number;
    reportCount: number;
  };
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

const internalRequest = async <T>(path: string): Promise<T> => {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'GET',
    headers: authHeaders,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Internal API request failed with status ${response.status}`
    );
  }

  return (await response.json()) as T;
};

export const getPlatformAdminOperationalData =
  async (): Promise<InternalOperationalData> => {
    const [auditPayload, sessionPayload, reportPayload] = await Promise.all([
      internalRequest<CollectionResponse<InternalAuditLogSummary>>(
        '/audit-logs'
      ),
      internalRequest<CollectionResponse<InternalSessionSummary>>('/sessions'),
      internalRequest<CollectionResponse<InternalReportSummary>>('/reports'),
    ]);

    const auditLogs = getCollection(auditPayload);
    const sessions = getCollection(sessionPayload);
    const reports = getCollection(reportPayload);

    return {
      auditLogs,
      sessions,
      reports,
      metrics: {
        auditLogCount: auditLogs.length,
        sessionCount: sessions.length,
        completedSessionCount: sessions.filter((session) => {
          return session.status === 'COMPLETED';
        }).length,
        reportCount: reports.length,
      },
    };
  };

export const getResearcherOperationalData =
  async (): Promise<InternalOperationalData> => {
    const [sessionPayload, reportPayload] = await Promise.all([
      internalRequest<CollectionResponse<InternalSessionSummary>>('/sessions'),
      internalRequest<CollectionResponse<InternalReportSummary>>('/reports'),
    ]);

    const sessions = getCollection(sessionPayload);
    const reports = getCollection(reportPayload);

    return {
      auditLogs: [],
      sessions,
      reports,
      metrics: {
        auditLogCount: 0,
        sessionCount: sessions.length,
        completedSessionCount: sessions.filter((session) => {
          return session.status === 'COMPLETED';
        }).length,
        reportCount: reports.length,
      },
    };
  };
