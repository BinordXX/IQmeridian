import Link from 'next/link';

import { fetchAdminOverview } from '../_lib/internal-api';

export default async function InternalAdminDashboardPage() {
  const overview = await fetchAdminOverview();

  const totalUsers = Object.values(overview.userCountsByRole).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Platform administration
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Operational oversight dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This dashboard now reads operational aggregates from the internal
            admin overview endpoint.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/internal/admin/sessions"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Review sessions
          </Link>
          <Link
            href="/internal/admin/exports"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Manage exports
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Organisations</p>
          <p className="mt-3 text-3xl font-semibold">
            {overview.organisationCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active campaigns</p>
          <p className="mt-3 text-3xl font-semibold">
            {overview.activeCampaigns}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total users</p>
          <p className="mt-3 text-3xl font-semibold">{totalUsers}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Platform issues</p>
          <p className="mt-3 text-3xl font-semibold">
            {overview.platformErrors.length}
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">User counts by role</h2>

          <dl className="mt-5 space-y-3 text-sm">
            {Object.entries(overview.userCountsByRole).map(([role, count]) => (
              <div
                key={role}
                className="flex justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <dt className="text-slate-500">{role}</dt>
                <dd className="font-semibold">{count}</dd>
              </div>
            ))}
          </dl>

          {Object.keys(overview.userCountsByRole).length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No user-role counts are available yet.
            </p>
          ) : null}
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recent audit activity</h2>

          <div className="mt-5 space-y-3">
            {overview.recentAuditActivity.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {event.action}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {event.entityType ?? 'Unknown entity'} ·{' '}
                      {event.entityId ?? 'No entity ID'}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold">
                    {event.actor}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-500">{event.createdAt}</p>
              </article>
            ))}
          </div>

          {overview.recentAuditActivity.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No audit activity is available yet.
            </p>
          ) : null}
        </section>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Platform errors or failures</h2>

          <div className="mt-5 space-y-3">
            {overview.platformErrors.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
                <p className="font-semibold">{event.action}</p>
                <p className="mt-2 text-slate-600">
                  {event.entityType ?? 'Unknown entity'} ·{' '}
                  {event.entityId ?? 'No entity ID'}
                </p>
              </article>
            ))}
          </div>

          {overview.platformErrors.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No platform error audit events are currently recorded.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Export events</h2>

          <div className="mt-5 space-y-3">
            {overview.exportEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
                <p className="font-semibold">{event.action}</p>
                <p className="mt-2 text-slate-600">{event.createdAt}</p>
              </article>
            ))}
          </div>

          {overview.exportEvents.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No export audit events are currently recorded.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Item activations and retirements
          </h2>

          <div className="mt-5 space-y-3">
            {overview.itemLifecycleEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
                <p className="font-semibold">{event.action}</p>
                <p className="mt-2 text-slate-600">
                  {event.entityId ?? 'No entity ID'}
                </p>
              </article>
            ))}
          </div>

          {overview.itemLifecycleEvents.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No item activation or retirement audit events are currently
              recorded.
            </p>
          ) : null}
        </section>
      </section>
    </div>
  );
}
