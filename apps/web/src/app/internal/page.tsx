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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{supportingText}</p>
    </section>
  );
}

export default function InternalDashboardPage() {
  const activeItems = internalItems.filter((item) => item.active).length;
  const draftItems = internalItems.filter(
    (item) => item.status === 'DRAFT'
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              IQMeridian internal tooling
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Operational and research overview
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              This landing page separates internal oversight from candidate and
              employer interfaces. It gives platform administrators and
              researchers a concise view of campaign activity, assessment
              completion, suspicious session signals, item review pressure, and
              export readiness.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/internal/researcher/item-bank"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Open item bank
            </Link>
            <Link
              href="/internal/researcher/item-bank/new"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Create item
            </Link>
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Recent suspicious flags
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  These are not treated as proof of misconduct. They are
                  operational signals requiring careful review.
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Signal</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Raised</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {internalOperationalSnapshot.recentSuspiciousFlags.map(
                    (flag) => (
                      <tr key={flag.id}>
                        <td className="px-4 py-3 font-medium">
                          {flag.sessionId}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {flag.signal}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold">
                            {flag.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {flag.raisedAt}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Item-bank status</h2>
            <p className="mt-1 text-sm text-slate-600">
              Researcher tooling must distinguish editable draft items from
              historically active items that require versioning.
            </p>

            <dl className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-sm text-slate-600">Active items</dt>
                <dd className="text-sm font-semibold">{activeItems}</dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-sm text-slate-600">Draft items</dt>
                <dd className="text-sm font-semibold">{draftItems}</dd>
              </div>
              {(['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'RETIRED'] as const).map(
                (status) => (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <dt className="text-sm text-slate-600">
                      {itemStatusLabels[status]}
                    </dt>
                    <dd className="text-sm font-semibold">
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
