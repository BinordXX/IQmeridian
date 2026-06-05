import Link from 'next/link';

export default function EmployerCandidatesPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Candidate statuses
      </p>

      <h2 className="mt-3 text-3xl font-bold text-slate-950">
        Candidate monitoring
      </h2>

      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
        Candidate status views are organised within campaign workspaces so that
        invitations, sessions, completion state, and results remain tied to a
        specific hiring process.
      </p>

      <Link
        href="/employer/campaigns"
        className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Open campaigns
      </Link>
    </section>
  );
}
