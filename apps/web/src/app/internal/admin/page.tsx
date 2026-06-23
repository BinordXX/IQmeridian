import {
  AlertTriangle,
  Building2,
  FileSearch,
  FileText,
  ShieldAlert,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { fetchAdminOverview } from '../_lib/internal-api';

const MetricCard = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: string;
}) => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
        </div>

        <span
          className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
            tone,
          ].join(' ')}
        >
          <Icon size={20} strokeWidth={2} />
        </span>
      </div>
    </article>
  );
};

export default async function InternalAdminDashboardPage() {
  const overview = await fetchAdminOverview();

  const totalUsers = Object.values(overview.userCountsByRole).reduce(
    (sum, count) => sum + count,
    0
  );

  const pendingExportRequestCount = overview.exportRequestCounts.requested;

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
            This dashboard reads operational aggregates, audit events, export
            requests, and recorded internal API failures from the backend.
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
            className="relative rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Export governance
            {pendingExportRequestCount > 0 ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                {pendingExportRequestCount}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      {pendingExportRequestCount > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-700">
                <AlertTriangle size={20} strokeWidth={2} />
              </span>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                  Pending export review
                </p>
                <h2 className="mt-2 text-xl font-semibold text-amber-950">
                  {pendingExportRequestCount} export request
                  {pendingExportRequestCount === 1 ? '' : 's'} awaiting admin
                  decision
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
                  Researcher export requests require platform-admin review
                  before they can be generated and downloaded.
                </p>
              </div>
            </div>

            <Link
              href="/internal/admin/exports"
              className="w-fit rounded-full bg-amber-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Review export requests
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {overview.pendingExportRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {request.dataset} · {request.format}
                    </p>
                    <p className="mt-1 text-slate-600">
                      Requested by {request.requestedBy} · {request.createdAt}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                    {request.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Organisations"
          value={overview.organisationCount}
          icon={Building2}
          tone="border-blue-100 bg-blue-50 text-blue-700"
        />

        <MetricCard
          label="Active campaigns"
          value={overview.activeCampaigns}
          icon={FileSearch}
          tone="border-violet-100 bg-violet-50 text-violet-700"
        />

        <MetricCard
          label="Pending export reviews"
          value={pendingExportRequestCount}
          icon={FileText}
          tone="border-amber-100 bg-amber-50 text-amber-700"
        />

        <MetricCard
          label="Total users"
          value={totalUsers}
          icon={UsersRound}
          tone="border-emerald-100 bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="Runtime/internal API failures"
          value={overview.platformErrors.length}
          icon={ShieldAlert}
          tone="border-rose-100 bg-rose-50 text-rose-700"
        />
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
          <h2 className="text-lg font-semibold">
            Recorded runtime/internal API failures
          </h2>

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
                <p className="mt-2 text-xs text-slate-500">{event.createdAt}</p>
              </article>
            ))}
          </div>

          {overview.platformErrors.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              No runtime internal API failure audit events are currently
              recorded. Local TypeScript, Docker, or Next.js compile errors are
              developer-environment failures and are not captured here.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recorded export requests</h2>

          <div className="mt-5 space-y-3">
            {overview.exportEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
                <p className="font-semibold">{event.action}</p>
                <p className="mt-2 text-slate-600">
                  {event.entityType ?? 'Analytics export'} ·{' '}
                  {event.entityId ?? 'No dataset ID'}
                </p>
                <p className="mt-2 text-xs text-slate-500">{event.createdAt}</p>
              </article>
            ))}
          </div>

          {overview.exportEvents.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No export request audit events are currently recorded.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Item lifecycle events</h2>

          <div className="mt-5 space-y-3">
            {overview.itemLifecycleEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
                <p className="font-semibold">{event.action}</p>
                <p className="mt-2 text-slate-600">
                  {event.entityType ?? 'Item'} ·{' '}
                  {event.entityId ?? 'No entity ID'}
                </p>
                <p className="mt-2 text-xs text-slate-500">{event.createdAt}</p>
              </article>
            ))}
          </div>

          {overview.itemLifecycleEvents.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No item lifecycle audit events are currently recorded.
            </p>
          ) : null}
        </section>
      </section>
    </div>
  );
}
