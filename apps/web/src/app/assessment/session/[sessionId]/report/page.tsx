type AssessmentReportPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function AssessmentReportPage({
  params,
}: AssessmentReportPageProps) {
  const { sessionId } = await params;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Assessment report</h2>
      <p className="mt-3 text-sm text-slate-300">
        This page will retrieve the candidate-visible report after scoring and
        render domain scores, overall band, and interpretation.
      </p>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm text-slate-400">Session ID</p>
        <p className="mt-1 break-all font-mono text-sm">{sessionId}</p>
      </div>
    </div>
  );
}