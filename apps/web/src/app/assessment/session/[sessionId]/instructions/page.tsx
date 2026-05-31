import { AssessmentInstructionsScreen } from '@/components/assessment/assessment-instructions-screen';

type SessionInstructionsPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SessionInstructionsPage({
  params,
}: SessionInstructionsPageProps) {
  const { sessionId } = await params;

  return (
    <AssessmentInstructionsScreen
      mode="session"
      sessionId={sessionId}
      nextHref={`/assessment/session/${sessionId}/readiness`}
    />
  );
}