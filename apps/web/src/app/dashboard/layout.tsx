import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { requireAnyRole } from '@/lib/route-guards';
import { DashboardSidebarShell } from './_components/dashboard-sidebar-shell';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await requireAnyRole(['CONSUMER', 'CANDIDATE'], '/dashboard');
  const role = session.user.role;

  if (role !== 'CONSUMER' && role !== 'CANDIDATE') {
    redirect('/signin');
  }

  return (
    <DashboardSidebarShell
      role={role}
      user={{
        email: session.user.email,
        image: session.user.image,
        name: session.user.name,
      }}
    >
      {children}
    </DashboardSidebarShell>
  );
}
