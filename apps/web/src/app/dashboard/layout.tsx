import type { ReactNode } from 'react';

import { requireRouteAccess } from '@/lib/route-guards';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  await requireRouteAccess('/dashboard');

  return <>{children}</>;
}
