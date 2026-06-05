import { notFound } from 'next/navigation';

import { getEmployerCampaignById } from '@/features/employer/api/employer-dashboard-api';
import { EmployerCampaignDetail } from '@/features/employer/components/employer-campaign-detail';
import type { EmployerCampaignDetail as EmployerCampaignDetailData } from '@/features/employer/api/employer-dashboard-api';

type EmployerCampaignDetailPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

const getCampaignSafely = async (
  campaignId: string
): Promise<EmployerCampaignDetailData | null> => {
  try {
    return await getEmployerCampaignById(campaignId);
  } catch {
    return null;
  }
};

export default async function EmployerCampaignDetailPage({
  params,
}: EmployerCampaignDetailPageProps) {
  const { campaignId } = await params;
  const campaign = await getCampaignSafely(campaignId);

  if (!campaign) {
    notFound();
  }

  return <EmployerCampaignDetail campaign={campaign} />;
}
