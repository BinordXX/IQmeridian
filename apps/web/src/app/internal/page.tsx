import Link from 'next/link';

import {
  internalItems,
  internalOperationalSnapshot,
  itemStatusLabels,
} from './_data/internal-tooling-data';

function OverviewCard({
  label,
  value,
  supportingText,
}: {
  label: string;
  value: string | number;
  supportingText: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{supportingText}</p>
    </section>
  );
}

export default function InternalDashboardPage() {
  const activeItems = internalItems.filter((item) => item.active).length;
  const draftItems = internalItems.filter(
    (item) => item.status === 'DRAFT'
  ).length;

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] md:p-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
          />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                IQMeridian internal tooling
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
                Operational and research overview
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                This landing page separates internal oversight from candidate
                and employer interfaces. It gives platform administrators and
                researchers a concise view of campaign activity, assessment
                completion, suspicious session signals, item review pressure,
                and export readiness.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/internal/researcher/item-bank"
                className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
              >
                Open item bank
              </Link>

              <Link
                href="/internal/researcher/item-bank/new"
                className="rounded-full border border-white/10 bg-[#020817]/70 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
              >
                Create item
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <OverviewCard
            label="Active campaigns"
            value={internalOperationalSnapshot.activeCampaigns}
            supportingText="Campaigns currently available for candidate invitations."
          />

          <OverviewCard
            label="Total sessions"
            value={internalOperationalSnapshot.totalSessions}
            supportingText="All sessions recorded across internal assessment activity."
          />

          <OverviewCard
            label="Completed sessions"
            value={internalOperationalSnapshot.completedSessions}
            supportingText="Sessions finalised through the submission and processing flow."
          />

          <OverviewCard
            label="Recent suspicious flags"
            value={internalOperationalSnapshot.recentSuspiciousFlags.length}
            supportingText="Signals requiring operational or researcher interpretation."
          />

          <OverviewCard
            label="Items under review"
            value={internalOperationalSnapshot.itemsUnderReview}
            supportingText="Items paused for psychometric, content, or operational review."
          />

          <OverviewCard
            label="Export availability"
            value="Available"
            supportingText={internalOperationalSnapshot.exportAvailability}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white">
                  Recent suspicious flags
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  These are not treated as proof of misconduct. They are
                  operational signals requiring careful review.
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#020817]/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Signal</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Raised</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10 bg-[#07142f]/60">
                  {internalOperationalSnapshot.recentSuspiciousFlags.map(
                    (flag) => (
                      <tr key={flag.id}>
                        <td className="px-4 py-3 font-black text-white">
                          {flag.sessionId}
                        </td>

                        <td className="px-4 py-3 text-slate-300">
                          {flag.signal}
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-xs font-black text-amber-100">
                            {flag.severity}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-400">
                          {flag.raisedAt}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Item-bank status</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Researcher tooling must distinguish editable draft items from
              historically active items that require versioning.
            </p>

            <dl className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-sm text-slate-400">Active items</dt>
                <dd className="text-sm font-black text-white">{activeItems}</dd>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-sm text-slate-400">Draft items</dt>
                <dd className="text-sm font-black text-white">{draftItems}</dd>
              </div>

              {(['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'RETIRED'] as const).map(
                (status) => (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3"
                  >
                    <dt className="text-sm text-slate-400">
                      {itemStatusLabels[status]}
                    </dt>

                    <dd className="text-sm font-black text-white">
                      {
                        internalItems.filter((item) => item.status === status)
                          .length
                      }
                    </dd>
                  </div>
                )
              )}
            </dl>
          </aside>
        </section>
      </div>
    </main>
  );
}
