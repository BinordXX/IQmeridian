import type { ReactNode } from 'react';

import { requirePlatformAdmin } from '@/lib/route-guards';

type InternalAdminLayoutProps = {
  children: ReactNode;
};

export default async function InternalAdminLayout({
  children,
}: InternalAdminLayoutProps) {
  await requirePlatformAdmin('/internal/admin');

  return children;
}
