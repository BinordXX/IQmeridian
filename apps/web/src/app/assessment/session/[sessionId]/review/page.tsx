import { redirect } from 'next/navigation';

type AssessmentReviewPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function AssessmentReviewPage({
  params,
}: AssessmentReviewPageProps) {
  const { sessionId } = await params;

  redirect(
    `/assessment/status?reason=invalid&sessionId=${encodeURIComponent(
      sessionId
    )}`
  );
}
