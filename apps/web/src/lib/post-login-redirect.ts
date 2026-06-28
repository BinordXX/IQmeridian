type SessionLikeRecord = Record<string, unknown>;

const ROLE_HOME_PATHS: Record<string, string> = {
  CANDIDATE: '/dashboard',
  CONSUMER: '/dashboard',
  EMPLOYER_ADMIN: '/employer',
  PLATFORM_ADMIN: '/internal/admin',
  RESEARCHER: '/internal/researcher',
};

function asRecord(value: unknown): SessionLikeRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as SessionLikeRecord;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

export function getSessionRole(session: unknown) {
  const sessionRecord = asRecord(session);

  if (!sessionRecord) {
    return null;
  }

  const directRole = getString(sessionRecord.role);

  if (directRole) {
    return directRole;
  }

  const userRecord = asRecord(sessionRecord.user);

  if (!userRecord) {
    return null;
  }

  return getString(userRecord.role);
}

export function getPostLoginRedirectPath(role: string | null | undefined) {
  if (!role) {
    return '/dashboard';
  }

  return ROLE_HOME_PATHS[role] ?? '/dashboard';
}

export function getSafeCallbackUrl(callbackUrl?: string) {
  if (!callbackUrl) {
    return '/auth/redirect';
  }

  if (!callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return '/auth/redirect';
  }

  return callbackUrl;
}