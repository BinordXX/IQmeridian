import type { ReactNode } from 'react';

import { requireAnyRole, requireEmployerAdmin } from '@/lib/route-guards';
import { EmployerSidebarShell } from './_components/employer-sidebar-shell';

type EmployerLayoutProps = {
  children: ReactNode;
};

export default async function EmployerLayout({
  children,
}: EmployerLayoutProps) {
  await requireEmployerAdmin('/employer/dashboard');

  const session = await requireAnyRole(['EMPLOYER_ADMIN'], '/employer');

  return (
    <EmployerSidebarShell
      user={{
        email: session.user.email,
        image: session.user.image,
        name: session.user.name,
        role: session.user.role,
      }}
    >
      {children}
    </EmployerSidebarShell>
  );
}
