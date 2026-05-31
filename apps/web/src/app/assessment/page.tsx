export default function AssessmentEntryPage() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Begin assessment</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
        This area is reserved for candidate and consumer assessment flows. Use an
        invitation link to start an employer-linked assessment, or continue an
        existing session from the assigned session route.
      </p>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm text-slate-400">
          Route status: assessment shell active.
        </p>
      </div>
    </div>
  );
}