type AssessmentSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function AssessmentSessionPage({
  params,
}: AssessmentSessionPageProps) {
  const { sessionId } = await params;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Assessment session</h2>
        <p className="mt-3 text-sm text-slate-300">
          This page will render the active section, current item, answer
          controls, autosave state, and navigation between allowed items.
        </p>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-400">Current item placeholder</p>
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="font-semibold">Session state</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-slate-400">Session ID</dt>
            <dd className="mt-1 break-all font-mono">{sessionId}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Timer</dt>
            <dd className="mt-1">Pending integration</dd>
          </div>
          <div>
            <dt className="text-slate-400">Autosave</dt>
            <dd className="mt-1">Pending integration</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}