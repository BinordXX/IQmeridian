import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export type AppRole =
  | 'PLATFORM_ADMIN'
  | 'RESEARCHER'
  | 'EMPLOYER_ADMIN'
  | 'CANDIDATE'
  | 'CONSUMER';

export function getDefaultDashboardForRole(role?: string | null) {
  switch (role) {
    case 'PLATFORM_ADMIN':
      return '/internal/admin';
    case 'RESEARCHER':
      return '/internal/researcher';
    case 'EMPLOYER_ADMIN':
      return '/employer/dashboard';
    case 'CANDIDATE':
      return '/dashboard';
    case 'CONSUMER':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

export async function requireAuthenticatedSession(callbackUrl = '/dashboard') {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (session.error === 'RefreshAccessTokenError') {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}

export async function requireAnyRole(
  allowedRoles: AppRole[],
  callbackUrl: string
) {
  const session = await requireAuthenticatedSession(callbackUrl);
  const role = session.user.role;

  if (!role || !allowedRoles.includes(role as AppRole)) {
    redirect(getDefaultDashboardForRole(role));
  }

  return session;
}
