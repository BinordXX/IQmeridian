import { auth } from '@/auth';

export type SuperAdminAccountRole = 'SUPER_ADMIN' | 'PLATFORM_ADMIN';

export type SuperAdminAccountStatus =
  | 'PENDING_EMAIL_VERIFICATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DISABLED';

export type SuperAdminAuditActor = {
  id: string;
  email: string;
  name: string | null;
  role: SuperAdminAccountRole;
};

export type SuperAdminAuditEvent = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  user: SuperAdminAuditActor | null;
};

export type SuperAdminOverview = {
  totalSuperAdmins: number;
  activeSuperAdmins: number;
  totalPlatformAdmins: number;
  inactiveAdminAccounts: number;
  activePrivilegedSessions: number;
  recentPrivilegedAudit: SuperAdminAuditEvent[];
};

export type SuperAdminManagedAccount = {
  id: string;
  email: string;
  name: string | null;
  role: SuperAdminAccountRole;
  status: SuperAdminAccountStatus;
  emailVerifiedAt: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  activeSessionCount: number;
};

export type SuperAdminSessionRevocationResult = {
  userId: string;
  revokedSessionCount: number;
  revokedAt: string;
};

const normaliseBaseUrl = (baseUrl: string) => {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const getApiBaseUrl = () => {
  return normaliseBaseUrl(
    process.env.INTERNAL_API_BASE_URL ??
      process.env.API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001'
  );
};

const resolveAccessToken = async (providedAccessToken?: string) => {
  if (providedAccessToken) {
    return providedAccessToken;
  }

  const session = await auth();

  if (!session?.accessToken) {
    throw new Error('Super Admin API request failed: missing access token.');
  }

  return session.accessToken;
};

const readSuperAdminApi = async <T>(
  path: string,
  accessToken?: string
): Promise<T> => {
  const token = await resolveAccessToken(accessToken);

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');

    throw new Error(
      `Super Admin API request failed for ${path}: ${response.status} ${response.statusText}. ${details}`
    );
  }

  return response.json() as Promise<T>;
};

const writeSuperAdminApi = async <T>({
  path,
  method,
  body,
  accessToken,
}: {
  path: string;
  method: 'POST' | 'PATCH';
  body?: unknown;
  accessToken?: string;
}): Promise<T> => {
  const token = await resolveAccessToken(accessToken);

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined
        ? {}
        : {
            'Content-Type': 'application/json',
          }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');

    throw new Error(
      `Super Admin API request failed for ${path}: ${response.status} ${response.statusText}. ${details}`
    );
  }

  return response.json() as Promise<T>;
};

export const fetchSuperAdminOverview = (accessToken?: string) => {
  return readSuperAdminApi<SuperAdminOverview>(
    '/users/super-admin/overview',
    accessToken
  );
};

export const fetchSuperAdminAccounts = (accessToken?: string) => {
  return readSuperAdminApi<SuperAdminManagedAccount[]>(
    '/users/super-admin/admins',
    accessToken
  );
};

export const updateSuperAdminAccountStatus = ({
  userId,
  status,
  accessToken,
}: {
  userId: string;
  status: SuperAdminAccountStatus;
  accessToken?: string;
}) => {
  return writeSuperAdminApi<SuperAdminManagedAccount>({
    path: `/users/super-admin/admins/${encodeURIComponent(userId)}/status`,
    method: 'PATCH',
    body: {
      status,
    },
    accessToken,
  });
};

export const revokeSuperAdminAccountSessions = ({
  userId,
  accessToken,
}: {
  userId: string;
  accessToken?: string;
}) => {
  return writeSuperAdminApi<SuperAdminSessionRevocationResult>({
    path: `/users/super-admin/admins/${encodeURIComponent(
      userId
    )}/revoke-sessions`,
    method: 'POST',
    accessToken,
  });
};
