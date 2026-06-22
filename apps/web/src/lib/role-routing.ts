export type AppRole =
  | 'PLATFORM_ADMIN'
  | 'RESEARCHER'
  | 'EMPLOYER_ADMIN'
  | 'CANDIDATE'
  | 'CONSUMER';

export const roleDefaultDashboard: Record<AppRole, string> = {
  PLATFORM_ADMIN: '/internal/admin',
  RESEARCHER: '/internal/researcher',
  EMPLOYER_ADMIN: '/employer/dashboard',
  CANDIDATE: '/dashboard',
  CONSUMER: '/dashboard',
};

export const getDefaultDashboardForRole = (role: AppRole) => {
  return roleDefaultDashboard[role];
};

export const isAppRole = (value: unknown): value is AppRole => {
  return (
    value === 'PLATFORM_ADMIN' ||
    value === 'RESEARCHER' ||
    value === 'EMPLOYER_ADMIN' ||
    value === 'CANDIDATE' ||
    value === 'CONSUMER'
  );
};

export const toSafeLocalPath = (value?: string | null) => {
  if (!value) return null;

  const trimmed = value.trim();

  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (trimmed.startsWith('/api/')) return null;

  return trimmed;
};

export const isInternalPath = (path: string) => {
  return path === '/internal' || path.startsWith('/internal/');
};

export const isEmployerPath = (path: string) => {
  return path === '/employer' || path.startsWith('/employer/');
};

export const isAssessmentPath = (path: string) => {
  return path === '/assessment' || path.startsWith('/assessment/');
};

export const getLoginPathForRequestedPath = (requestedPath: string) => {
  if (isInternalPath(requestedPath)) return '/staff/login';
  return '/login';
};

export const buildLoginRedirect = ({
  loginPath,
  callbackUrl,
}: {
  loginPath: string;
  callbackUrl: string;
}) => {
  const safeCallbackUrl = toSafeLocalPath(callbackUrl) ?? '/dashboard';
  return `${loginPath}?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;
};

export const isPathAllowedForRole = ({
  role,
  path,
}: {
  role: AppRole;
  path: string;
}) => {
  const safePath = toSafeLocalPath(path);

  if (!safePath) return false;

  if (safePath === '/dashboard') {
    return role === 'CONSUMER' || role === 'CANDIDATE';
  }

  if (safePath === '/internal' || safePath.startsWith('/internal/admin')) {
    return role === 'PLATFORM_ADMIN';
  }

  if (safePath.startsWith('/internal/researcher')) {
    return role === 'PLATFORM_ADMIN' || role === 'RESEARCHER';
  }

  if (safePath.startsWith('/internal')) {
    return role === 'PLATFORM_ADMIN' || role === 'RESEARCHER';
  }

  if (safePath.startsWith('/employer')) {
    return role === 'EMPLOYER_ADMIN';
  }

  if (safePath.startsWith('/assessment')) {
    return role === 'CANDIDATE' || role === 'CONSUMER';
  }

  return safePath === roleDefaultDashboard[role];
};

export const resolvePostLoginRedirect = ({
  role,
  callbackUrl,
}: {
  role: AppRole;
  callbackUrl?: string | null;
}) => {
  const safeCallbackUrl = toSafeLocalPath(callbackUrl);

  if (
    safeCallbackUrl &&
    isPathAllowedForRole({ role, path: safeCallbackUrl })
  ) {
    return safeCallbackUrl;
  }

  return getDefaultDashboardForRole(role);
};
