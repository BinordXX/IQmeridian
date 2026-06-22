import { auth } from '@/auth';
import { redirect } from 'next/navigation';

import {
  buildLoginRedirect,
  getDefaultDashboardForRole,
  getLoginPathForRequestedPath,
  isAppRole,
  isPathAllowedForRole,
  type AppRole,
} from './role-routing';

export type { AppRole };

export const requireAuthenticatedUser = async (
  requestedPath = '/dashboard'
) => {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user || !isAppRole(role)) {
    redirect(
      buildLoginRedirect({
        loginPath: getLoginPathForRequestedPath(requestedPath),
        callbackUrl: requestedPath,
      })
    );
  }

  return {
    session,
    role,
  };
};

export const requireRouteAccess = async (requestedPath: string) => {
  const { session, role } = await requireAuthenticatedUser(requestedPath);

  if (!isPathAllowedForRole({ role, path: requestedPath })) {
    redirect(getDefaultDashboardForRole(role));
  }

  return {
    session,
    role,
  };
};

export const requireRole = async ({
  allowedRoles,
  requestedPath,
}: {
  allowedRoles: AppRole[];
  requestedPath: string;
}) => {
  const { session, role } = await requireAuthenticatedUser(requestedPath);

  if (!allowedRoles.includes(role)) {
    redirect(getDefaultDashboardForRole(role));
  }

  return {
    session,
    role,
  };
};

export const requirePlatformAdmin = async (
  requestedPath = '/internal/admin'
) => {
  return requireRole({
    allowedRoles: ['PLATFORM_ADMIN'],
    requestedPath,
  });
};

export const requireInternalStaff = async (requestedPath = '/internal') => {
  return requireRole({
    allowedRoles: ['PLATFORM_ADMIN', 'RESEARCHER'],
    requestedPath,
  });
};

export const requireEmployerAdmin = async (
  requestedPath = '/employer/dashboard'
) => {
  return requireRole({
    allowedRoles: ['EMPLOYER_ADMIN'],
    requestedPath,
  });
};

export const requireAnyRole = async (
  allowedRoles: AppRole[],
  requestedPath = '/dashboard'
) => {
  const { session } = await requireRole({
    allowedRoles,
    requestedPath,
  });

  return session;
};
