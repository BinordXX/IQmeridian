import { notFound } from 'next/navigation';

import { getEmployerCampaignById } from '@/features/employer/api/employer-dashboard-api';
import { EmployerCandidateDetail } from '@/features/employer/components/employer-candidate-detail';
import type { EmployerCampaignDetail } from '@/features/employer/api/employer-dashboard-api';

type EmployerCandidateDetailPageProps = {
  params: Promise<{
    campaignId: string;
    candidateId: string;
  }>;
};

const getCampaignSafely = async (
  campaignId: string
): Promise<EmployerCampaignDetail | null> => {
  try {
    return await getEmployerCampaignById(campaignId);
  } catch {
    return null;
  }
};

export default async function EmployerCandidateDetailPage({
  params,
}: EmployerCandidateDetailPageProps) {
  const { campaignId, candidateId } = await params;
  const campaign = await getCampaignSafely(campaignId);

  if (!campaign) {
    notFound();
  }

  const sessions = campaign.sessions ?? [];
  const invitations = campaign.invitations ?? [];

  const session = sessions.find((entry) => entry.id === candidateId);
  const invitation =
    invitations.find((entry) => entry.id === candidateId) ??
    invitations.find((entry) => entry.id === session?.invitationId);

  if (!session && !invitation) {
    notFound();
  }

  return (
    <EmployerCandidateDetail
      campaign={campaign}
      invitation={invitation}
      session={session}
    />
  );
}
