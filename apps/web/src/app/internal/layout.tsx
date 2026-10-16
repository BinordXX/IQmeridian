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

  if (
    session.user.role !== 'SUPER_ADMIN' &&
    session.user.role !== 'PLATFORM_ADMIN' &&
    session.user.role !== 'RESEARCHER'
  ) {
    redirect('/dashboard');
  }

  return (
    <InternalSidebarShell
      role={session.user.role}
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
