import type { ReactNode } from 'react';
import { requireAuthenticatedSession } from '@/lib/route-guards';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  await requireAuthenticatedSession('/dashboard');

  return children;
}
