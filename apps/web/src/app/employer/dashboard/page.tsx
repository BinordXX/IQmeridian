import { redirect } from 'next/navigation';

import { EmployerDashboardOverview } from '@/features/employer/components/employer-dashboard-overview';
import { guardEmployerWorkspaceRoute } from '@/features/employer/guards/employer-route-guards';

export default async function EmployerDashboardPage() {
  const guard = await guardEmployerWorkspaceRoute();

  if (!guard.allowed) {
    redirect('/employer/access-denied');
  }

  return <EmployerDashboardOverview data={guard.data} />;
}
