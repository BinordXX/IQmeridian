import { AssessmentEntryScreen } from '@/components/assessment/assessment-entry-screen';

type InvitationPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitationAssessmentPage({
  params,
}: InvitationPageProps) {
  const { token } = await params;

  return <AssessmentEntryScreen mode="invitation" invitationToken={token} />;
}
