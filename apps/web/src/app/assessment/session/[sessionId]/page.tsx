import { redirect } from "next/navigation";
import { guardLiveAssessmentRoute } from "@/features/assessment/guards/assessment-route-guards";

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

  const session = guard.data;

  return (
    <main>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </main>
  );
}