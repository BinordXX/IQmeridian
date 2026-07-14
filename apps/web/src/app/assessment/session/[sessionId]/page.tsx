import { LiveAssessmentLoader } from '@/features/assessment/components/live-assessment-loader';

type LiveAssessmentPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function LiveAssessmentPage({
  params,
}: LiveAssessmentPageProps) {
  const { sessionId } = await params;

  return <LiveAssessmentLoader sessionId={sessionId} />;
}
