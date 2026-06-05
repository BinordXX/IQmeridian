import { notFound } from 'next/navigation';

import { getEmployerCampaignById } from '@/features/employer/api/employer-dashboard-api';
import { EmployerCampaignStatusForm } from '@/features/employer/components/employer-campaign-status-form';
import type { EmployerCampaignSummary } from '@/features/employer/api/employer-dashboard-api';

type EditEmployerCampaignPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

const getCampaignSafely = async (
  campaignId: string
): Promise<EmployerCampaignSummary | null> => {
  try {
    return await getEmployerCampaignById(campaignId);
  } catch {
    return null;
  }
};

export default async function EditEmployerCampaignPage({
  params,
}: EditEmployerCampaignPageProps) {
  const { campaignId } = await params;
  const campaign = await getCampaignSafely(campaignId);

  if (!campaign) {
    notFound();
  }

  return <EmployerCampaignStatusForm campaign={campaign} />;
}
