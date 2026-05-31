type InvitationPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitationAssessmentPage({
  params,
}: InvitationPageProps) {
  const { token } = await params;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Invitation validation</h2>
      <p className="mt-3 text-sm text-slate-300">
        This page will validate the invitation token, show the assessment
        summary, and create a candidate session when the candidate starts.
      </p>

      <dl className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
        <dt className="text-slate-400">Invitation token</dt>
        <dd className="mt-1 font-mono text-slate-100">{token}</dd>
      </dl>
    </div>
  );
}