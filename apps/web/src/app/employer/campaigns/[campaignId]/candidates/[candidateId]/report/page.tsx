import { notFound } from 'next/navigation';

import {
  getEmployerCampaignById,
  getEmployerReportBySession,
} from '@/features/employer/api/employer-dashboard-api';
import { EmployerCandidateReport } from '@/features/employer/components/employer-candidate-report';
import type { EmployerCampaignDetail } from '@/features/employer/api/employer-dashboard-api';

type EmployerCandidateReportPageProps = {
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

const getReportSafely = async (sessionId: string) => {
  try {
    return await getEmployerReportBySession(sessionId);
  } catch {
    return null;
  }
};

export default async function EmployerCandidateReportPage({
  params,
}: EmployerCandidateReportPageProps) {
  const { campaignId, candidateId } = await params;
  const campaign = await getCampaignSafely(campaignId);

  if (!campaign) {
    notFound();
  }

  const sessions = campaign.sessions ?? [];
  const invitations = campaign.invitations ?? [];

  const session = sessions.find((entry) => entry.id === candidateId);
  const invitation =
    invitations.find((entry) => entry.id === session?.invitationId) ??
    invitations.find((entry) => entry.id === candidateId);

  if (!session) {
    notFound();
  }

  const report = await getReportSafely(session.id);

  return (
    <EmployerCandidateReport
      campaign={campaign}
      invitation={invitation}
      session={session}
      report={report}
    />
  );
}
