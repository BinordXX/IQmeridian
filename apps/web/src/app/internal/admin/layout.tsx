import type { ReactNode } from 'react';
import { requireAnyRole } from '@/lib/route-guards';

type InternalAdminLayoutProps = {
  children: ReactNode;
};

export default async function InternalAdminLayout({
  children,
}: InternalAdminLayoutProps) {
  await requireAnyRole(['PLATFORM_ADMIN'], '/internal/admin');

  return children;
}
