import Link from 'next/link';

import {
  fetchResearcherDashboardOverview,
  formatInternalDuration,
  itemDomainLabels,
  itemStatusLabels,
} from '../_lib/internal-api';

export default async function InternalResearcherDashboardPage() {
  const overview = await fetchResearcherDashboardOverview();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/internal" className="font-medium text-slate-600">
          Internal dashboard
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-950">
          Researcher analytics
        </span>
      </nav>

      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Researcher dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Internal quality-monitoring surface
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This dashboard reads aggregate researcher metrics from the backend
            and provides direct access to item, form, and pilot-governance
            workflows.
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
            href="/internal/researcher/forms"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Assessment forms
          </Link>

          <Link
            href="/internal/researcher/performance"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Section/form analytics
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/internal/researcher/forms"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Form management
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Assessment forms
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create reusable forms, define blueprints, and prepare forms for
            item placement, validation, locking, and governance.
          </p>
        </Link>

        <Link
          href="/internal/researcher/pilot-forms"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Pilot governance
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Pilot forms
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Validate pilot-form blueprints, inspect item-count gaps, control
            pilot status transitions, and lock forms when ready.
          </p>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(overview.totalItemsByStatus).map(([status, count]) => (
          <article
            key={status}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {itemStatusLabels[status] ?? status}
            </p>
            <p className="mt-3 text-3xl font-semibold">{count}</p>
            <p className="mt-2 text-sm text-slate-600">Items by status</p>
          </article>
        ))}

        {Object.keys(overview.totalItemsByStatus).length === 0 ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Items</p>
            <p className="mt-3 text-3xl font-semibold">0</p>
            <p className="mt-2 text-sm text-slate-600">
              No item records are available yet.
            </p>
          </article>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Active items by domain</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {overview.activeItemsByDomain.map((domain) => (
              <div
                key={domain.domain}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="text-slate-600">
                  {itemDomainLabels[domain.domain] ?? domain.label}
                </span>
                <span className="font-semibold">{domain.count}</span>
              </div>
            ))}
          </div>

          {overview.activeItemsByDomain.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No active item-domain data is available yet.
            </p>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Researcher indicators</h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Forms in use</dt>
              <dd className="font-semibold">{overview.formsInUse}</dd>
            </div>

            <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Recent session volume</dt>
              <dd className="font-semibold">{overview.recentSessionVolume}</dd>
            </div>

            <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Flagged sessions</dt>
              <dd className="font-semibold">{overview.flaggedSessionCount}</dd>
            </div>

            <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Average section time</dt>
              <dd className="font-semibold">
                {formatInternalDuration(overview.averageSectionCompletionTime)}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Items needing review</h2>

        <div className="mt-5 space-y-3">
          {overview.itemsNeedingReview.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm md:flex-row md:items-start md:justify-between"
            >
              <div>
                <p className="font-semibold">{item.id}</p>
                <p className="mt-1 text-slate-600">{item.label}</p>
                <p className="mt-2 text-xs text-slate-500">{item.reason}</p>
              </div>

              <Link
                href={`/internal/researcher/item-bank/${encodeURIComponent(
                  item.id
                )}`}
                className="w-fit rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
              >
                Open item
              </Link>
            </article>
          ))}
        </div>

        {overview.itemsNeedingReview.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            No items currently meet the review threshold.
          </p>
        ) : null}
      </section>
    </div>
  );
}