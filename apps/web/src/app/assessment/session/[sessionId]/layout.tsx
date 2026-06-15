import type { ReactNode } from 'react';
import { requireAnyRole } from '@/lib/route-guards';

type AssessmentSessionLayoutProps = {
  children: ReactNode;
};

export default async function AssessmentSessionLayout({
  children,
}: AssessmentSessionLayoutProps) {
  await requireAnyRole(['CANDIDATE', 'CONSUMER'], '/assessment');

  return children;
}
