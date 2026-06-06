import { redirect } from 'next/navigation';

import { guardResearcherRoute } from '@/features/internal/guards/internal-route-guards';

const MetricCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
};

export default async function InternalResearcherPage() {
  const guard = await guardResearcherRoute();

  if (!guard.allowed) {
    redirect('/internal/unavailable');
  }

  const { data } = guard;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Researcher workspace
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Assessment data review
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          This workspace is for reviewing assessment sessions, response
          completeness, scoring availability, and report outputs. It is separate
          from platform administration and employer-facing campaign management.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Sessions"
          value={data.metrics.sessionCount}
          helper="Assessment sessions available for review"
        />

        <MetricCard
          label="Completed sessions"
          value={data.metrics.completedSessionCount}
          helper="Submitted sessions available for analysis"
        />

        <MetricCard
          label="Reports"
          value={data.metrics.reportCount}
          helper="Generated reports linked to scoring"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-950">
            Recent sessions
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Session-level operational data for research review.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Session</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Completed</th>
              </tr>
            </thead>

            <tbody>
              {data.sessions.length > 0 ? (
                data.sessions.slice(0, 10).map((session) => (
                  <tr key={session.id} className="border-t border-slate-100">
                    <td className="px-4 py-4 text-sm font-medium text-slate-950">
                      {session.id}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {session.status}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {session.campaignId ?? 'Consumer session'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {session.completedAt
                        ? new Date(session.completedAt).toLocaleString()
                        : 'Not completed'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No sessions are available for research review.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
