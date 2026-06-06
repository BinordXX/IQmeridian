import Link from 'next/link';

import {
  formPerformanceSummaries,
  formatInternalDuration,
  formatInternalRate,
  internalItems,
  internalSessionReviewRecords,
  itemDomainLabels,
  itemStatusLabels,
  sectionPerformanceSummaries,
} from '../_data/internal-tooling-data';

export default function InternalResearcherDashboardPage() {
  const totalItemsByStatus = {
    DRAFT: internalItems.filter((item) => item.status === 'DRAFT').length,
    ACTIVE: internalItems.filter((item) => item.status === 'ACTIVE').length,
    UNDER_REVIEW: internalItems.filter((item) => item.status === 'UNDER_REVIEW')
      .length,
    RETIRED: internalItems.filter((item) => item.status === 'RETIRED').length,
  };

  const activeItemsByDomain = Object.entries(itemDomainLabels).map(
    ([domain, label]) => ({
      domain,
      label,
      count: internalItems.filter(
        (item) => item.domain === domain && item.status === 'ACTIVE'
      ).length,
    })
  );

  const recentSessionVolume = internalSessionReviewRecords.length;
  const flaggedSessionCount = internalSessionReviewRecords.filter(
    (session) => session.suspiciousFlagStatus !== 'NONE'
  ).length;
  const itemsNeedingReview = internalItems.filter(
    (item) => item.status === 'UNDER_REVIEW' || Boolean(item.flaggedReason)
  );

  const averageSectionCompletionTime =
    sectionPerformanceSummaries.reduce(
      (total, section) => total + section.averageCompletionTimeMinutes,
      0
    ) / sectionPerformanceSummaries.length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
              This dashboard gives researchers a compact view of item status,
              domain coverage, form usage, recent session volume, suspicious
              review pressure, completion timing, and items that require closer
              inspection.
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
              href="/internal/researcher/performance"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Section/form analytics
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(totalItemsByStatus).map(([status, count]) => (
            <article
              key={status}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">
                {itemStatusLabels[status as keyof typeof itemStatusLabels]}
              </p>
              <p className="mt-3 text-3xl font-semibold">{count}</p>
              <p className="mt-2 text-sm text-slate-600">Items by status</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Active items by domain</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This helps researchers see whether operational coverage is
              concentrated in some domains while others remain underdeveloped.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {activeItemsByDomain.map((domain) => (
                <div
                  key={domain.domain}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
                >
                  <span className="text-slate-600">{domain.label}</span>
                  <span className="font-semibold">{domain.count}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Researcher indicators</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Forms in use</dt>
                <dd className="font-semibold">
                  {
                    formPerformanceSummaries.filter(
                      (form) => form.completedSessions > 0
                    ).length
                  }
                </dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Recent session volume</dt>
                <dd className="font-semibold">{recentSessionVolume}</dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Flagged sessions</dt>
                <dd className="font-semibold">{flaggedSessionCount}</dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Average section time</dt>
                <dd className="font-semibold">
                  {formatInternalDuration(
                    Math.round(averageSectionCompletionTime * 10) / 10
                  )}
                </dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Forms in use</h2>

            <div className="mt-5 space-y-3">
              {formPerformanceSummaries.map((form) => (
                <article
                  key={form.formId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                >
                  <p className="font-semibold">{form.formLabel}</p>
                  <p className="mt-1 text-slate-600">
                    Completion rate {formatInternalRate(form.completionRate)} ·
                    average time{' '}
                    {formatInternalDuration(form.averageCompletionTimeMinutes)}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Items needing review</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Items appear here when they are under review or already have an
              active flag reason.
            </p>

            <div className="mt-5 space-y-3">
              {itemsNeedingReview.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm md:flex-row md:items-start md:justify-between"
                >
                  <div>
                    <p className="font-semibold">{item.id}</p>
                    <p className="mt-1 text-slate-600">{item.label}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.flaggedReason ?? 'Review required'}
                    </p>
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
          </div>
        </section>
      </div>
    </main>
  );
}
