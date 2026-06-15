import type { ReactNode } from 'react';
import { requireAnyRole } from '@/lib/route-guards';

type InternalResearcherLayoutProps = {
  children: ReactNode;
};

export default async function InternalResearcherLayout({
  children,
}: InternalResearcherLayoutProps) {
  await requireAnyRole(
    ['PLATFORM_ADMIN', 'RESEARCHER'],
    '/internal/researcher'
  );

  return children;
}
