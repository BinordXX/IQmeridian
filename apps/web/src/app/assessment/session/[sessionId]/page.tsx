import { redirect } from 'next/navigation';
import { LiveAssessmentShell } from '@/features/assessment/components/live-assessment-shell';
import { guardLiveAssessmentRoute } from '@/features/assessment/guards/assessment-route-guards';

type LiveAssessmentPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function LiveAssessmentPage({
  params,
}: LiveAssessmentPageProps) {
  const { sessionId } = await params;
  const guard = await guardLiveAssessmentRoute(sessionId);

  if (!guard.allowed) {
    redirect(guard.redirectTo);
  }

  return <LiveAssessmentShell session={guard.data} />;
}
