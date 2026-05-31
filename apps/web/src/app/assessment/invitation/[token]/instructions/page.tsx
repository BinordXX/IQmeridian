import { AssessmentInstructionsScreen } from '@/components/assessment/assessment-instructions-screen';

type InvitationInstructionsPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitationInstructionsPage({
  params,
}: InvitationInstructionsPageProps) {
  const { token } = await params;

  return (
    <AssessmentInstructionsScreen
      mode="invitation"
      invitationToken={token}
      nextHref={`/assessment/invitation/${token}/readiness`}
    />
  );
}