import { redirect } from 'next/navigation';

import { EmployerCampaignList } from '@/features/employer/components/employer-campaign-list';
import { guardEmployerWorkspaceRoute } from '@/features/employer/guards/employer-route-guards';

export default async function EmployerCampaignsPage() {
  const guard = await guardEmployerWorkspaceRoute();

  if (!guard.allowed) {
    redirect('/employer/access-denied');
  }

  return (
    <EmployerCampaignList
      campaigns={guard.data.campaigns}
      sessions={guard.data.sessions}
    />
  );
}
