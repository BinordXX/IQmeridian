import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { requireInternalStaff } from '@/lib/route-guards';
import { InternalSidebarShell } from './_components/internal-sidebar-shell';

type InternalLayoutProps = {
  children: ReactNode;
};

export default async function InternalLayout({
  children,
}: InternalLayoutProps) {
  const { session, role } = await requireInternalStaff('/internal');

  if (role !== 'PLATFORM_ADMIN' && role !== 'RESEARCHER') {
    redirect('/dashboard');
  }

  return (
    <InternalSidebarShell
      role={role}
      user={{
        email: session.user.email,
        image: session.user.image,
        name: session.user.name,
      }}
    >
      {children}
    </InternalSidebarShell>
  );
}