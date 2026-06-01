type AssessmentReviewPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function AssessmentReviewPage({
  params,
}: AssessmentReviewPageProps) {
  const { sessionId } = await params;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Review before submission</h2>
      <p className="mt-3 text-sm text-slate-300">
        This page will show answered and unanswered items before final
        submission.
      </p>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm text-slate-400">Session ID</p>
        <p className="mt-1 break-all font-mono text-sm">{sessionId}</p>
      </div>
    </div>
  );
}
