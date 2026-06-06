export type InternalRole = 'PLATFORM_ADMIN' | 'RESEARCHER' | 'NONE';

export type InternalAccessSurface =
  | 'ITEM_BANK'
  | 'ITEM_ANALYTICS'
  | 'SESSION_REVIEW'
  | 'SUSPICIOUS_SESSION_REVIEW'
  | 'ANALYTICS_EXPORTS'
  | 'RESEARCHER_DASHBOARD'
  | 'ADMIN_DASHBOARD'
  | 'GENERAL_INTERNAL';

export const internalRoleLabels: Record<InternalRole, string> = {
  PLATFORM_ADMIN: 'Platform admin',
  RESEARCHER: 'Researcher',
  NONE: 'No internal access',
};

const roleAccessMatrix: Record<InternalRole, InternalAccessSurface[]> = {
  PLATFORM_ADMIN: [
    'ITEM_BANK',
    'ITEM_ANALYTICS',
    'SESSION_REVIEW',
    'SUSPICIOUS_SESSION_REVIEW',
    'ANALYTICS_EXPORTS',
    'RESEARCHER_DASHBOARD',
    'ADMIN_DASHBOARD',
    'GENERAL_INTERNAL',
  ],
  RESEARCHER: [
    'ITEM_BANK',
    'ITEM_ANALYTICS',
    'ANALYTICS_EXPORTS',
    'RESEARCHER_DASHBOARD',
    'GENERAL_INTERNAL',
  ],
  NONE: [],
};

export function getCurrentInternalRole(): InternalRole {
  const configuredRole = process.env.NEXT_PUBLIC_INTERNAL_DEV_ROLE;

  if (
    configuredRole === 'PLATFORM_ADMIN' ||
    configuredRole === 'RESEARCHER' ||
    configuredRole === 'NONE'
  ) {
    return configuredRole;
  }

  return 'PLATFORM_ADMIN';
}

export function getInternalSurfaceForPath(
  pathname: string
): InternalAccessSurface {
  if (pathname.startsWith('/internal/researcher/item-bank')) {
    return 'ITEM_BANK';
  }

  if (pathname.startsWith('/internal/researcher/performance')) {
    return 'ITEM_ANALYTICS';
  }

  if (pathname.startsWith('/internal/researcher')) {
    return 'RESEARCHER_DASHBOARD';
  }

  if (pathname.startsWith('/internal/admin/sessions/suspicious')) {
    return 'SUSPICIOUS_SESSION_REVIEW';
  }

  if (pathname.startsWith('/internal/admin/sessions')) {
    return 'SESSION_REVIEW';
  }

  if (pathname.startsWith('/internal/admin/exports')) {
    return 'ANALYTICS_EXPORTS';
  }

  if (pathname.startsWith('/internal/admin')) {
    return 'ADMIN_DASHBOARD';
  }

  return 'GENERAL_INTERNAL';
}

export function canAccessInternalSurface({
  role,
  surface,
}: {
  role: InternalRole;
  surface: InternalAccessSurface;
}) {
  return roleAccessMatrix[role].includes(surface);
}
