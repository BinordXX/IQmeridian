import type { ReactNode } from 'react';

import { requireSuperAdmin } from '@/lib/route-guards';

type SuperAdminLayoutProps = {
  children: ReactNode;
};

export default async function SuperAdminLayout({
  children,
}: SuperAdminLayoutProps) {
  await requireSuperAdmin('/internal/admin/super');

  return children;
}
