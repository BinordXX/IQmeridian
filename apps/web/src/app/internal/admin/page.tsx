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
    <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
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
      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Platform administration
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              Operational oversight dashboard
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              This dashboard reads operational aggregates, audit events, export
              requests, and recorded internal API failures from the backend.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/internal/admin/sessions"
              className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
            >
              Review sessions
            </Link>

            <Link
              href="/internal/admin/exports"
              className="relative rounded-full border border-white/10 bg-[#020817]/70 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
            >
              Export governance
              {pendingExportRequestCount > 0 ? (
                <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-black text-amber-100">
                  {pendingExportRequestCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Link
          className="rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition hover:border-cyan-300/25 hover:bg-[#0b1c3f]"
          href="/internal/admin/assessment-forms"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Assessment authoring
          </p>

          <h2 className="mt-3 text-xl font-black text-white">
            Assessment forms
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Create assessment forms, review section coverage, assign
            researchers, and control publication status for consumer delivery.
          </p>
        </Link>

        <Link
          className="rounded-[2rem] border border-emerald-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition hover:border-emerald-300/25 hover:bg-[#0b1c3f]"
          href="/internal/admin/item-review"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
            Item governance
          </p>

          <h2 className="mt-3 text-xl font-black text-white">Review queue</h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Approve, reject, or request changes on researcher-authored items
            before they become active assessment content.
          </p>
        </Link>
      </section>

      {pendingExportRequestCount > 0 ? (
        <section className="rounded-[2rem] border border-amber-300/20 bg-amber-400/10 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-400/10 text-amber-100">
                <AlertTriangle size={20} strokeWidth={2} />
              </span>

              <div>
                <p className="text-sm font-black uppercase tracking-wide text-amber-200">
                  Pending export review
                </p>

                <h2 className="mt-2 text-xl font-black text-white">
                  {pendingExportRequestCount} export request
                  {pendingExportRequestCount === 1 ? '' : 's'} awaiting admin
                  decision
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-100/80">
                  Researcher export requests require platform-admin review
                  before they can be generated and downloaded.
                </p>
              </div>
            </div>

            <Link
              href="/internal/admin/exports"
              className="w-fit rounded-full border border-amber-300/25 bg-amber-400/15 px-4 py-2 text-sm font-black text-amber-50 transition hover:bg-amber-400/20"
            >
              Review export requests
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {overview.pendingExportRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-amber-300/15 bg-[#020817]/70 px-4 py-3 text-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-white">
                      {request.dataset} · {request.format}
                    </p>

                    <p className="mt-1 text-amber-100/70">
                      Requested by {request.requestedBy} · {request.createdAt}
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-xs font-black text-amber-100">
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
          tone="border-blue-300/20 bg-blue-400/10 text-blue-100"
        />

        <MetricCard
          label="Active campaigns"
          value={overview.activeCampaigns}
          icon={FileSearch}
          tone="border-violet-300/20 bg-violet-400/10 text-violet-100"
        />

        <MetricCard
          label="Pending export reviews"
          value={pendingExportRequestCount}
          icon={FileText}
          tone="border-amber-300/20 bg-amber-400/10 text-amber-100"
        />

        <MetricCard
          label="Total users"
          value={totalUsers}
          icon={UsersRound}
          tone="border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
        />

        <MetricCard
          label="Runtime/internal API failures"
          value={overview.platformErrors.length}
          icon={ShieldAlert}
          tone="border-rose-300/20 bg-rose-400/10 text-rose-100"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <h2 className="text-lg font-black text-white">User counts by role</h2>

          <dl className="mt-5 space-y-3 text-sm">
            {Object.entries(overview.userCountsByRole).map(([role, count]) => (
              <div
                key={role}
                className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3"
              >
                <dt className="text-slate-400">{role}</dt>
                <dd className="font-black text-white">{count}</dd>
              </div>
            ))}
          </dl>

          {Object.keys(overview.userCountsByRole).length === 0 ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-400">
              No user-role counts are available yet.
            </p>
          ) : null}
        </aside>

        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <h2 className="text-lg font-black text-white">
            Recent audit activity
          </h2>

          <div className="mt-5 space-y-3">
            {overview.recentAuditActivity.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-white">{event.action}</p>

                    <p className="mt-1 text-slate-400">
                      {event.entityType ?? 'Unknown entity'} ·{' '}
                      {event.entityId ?? 'No entity ID'}
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-1 text-xs font-black text-cyan-100">
                    {event.actor}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-500">{event.createdAt}</p>
              </article>
            ))}
          </div>

          {overview.recentAuditActivity.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-400">
              No audit activity is available yet.
            </p>
          ) : null}
        </section>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <h2 className="text-lg font-black text-white">
            Recorded runtime/internal API failures
          </h2>

          <div className="mt-5 space-y-3">
            {overview.platformErrors.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm"
              >
                <p className="font-black text-white">{event.action}</p>

                <p className="mt-2 text-slate-400">
                  {event.entityType ?? 'Unknown entity'} ·{' '}
                  {event.entityId ?? 'No entity ID'}
                </p>

                <p className="mt-2 text-xs text-slate-500">{event.createdAt}</p>
              </article>
            ))}
          </div>

          {overview.platformErrors.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm leading-6 text-slate-400">
              No runtime internal API failure audit events are currently
              recorded. Local TypeScript, Docker, or Next.js compile errors are
              developer-environment failures and are not captured here.
            </p>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <h2 className="text-lg font-black text-white">
            Recorded export requests
          </h2>

          <div className="mt-5 space-y-3">
            {overview.exportEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm"
              >
                <p className="font-black text-white">{event.action}</p>

                <p className="mt-2 text-slate-400">
                  {event.entityType ?? 'Analytics export'} ·{' '}
                  {event.entityId ?? 'No dataset ID'}
                </p>

                <p className="mt-2 text-xs text-slate-500">{event.createdAt}</p>
              </article>
            ))}
          </div>

          {overview.exportEvents.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-400">
              No export request audit events are currently recorded.
            </p>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <h2 className="text-lg font-black text-white">
            Item lifecycle events
          </h2>

          <div className="mt-5 space-y-3">
            {overview.itemLifecycleEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm"
              >
                <p className="font-black text-white">{event.action}</p>

                <p className="mt-2 text-slate-400">
                  {event.entityType ?? 'Item'} ·{' '}
                  {event.entityId ?? 'No entity ID'}
                </p>

                <p className="mt-2 text-xs text-slate-500">{event.createdAt}</p>
              </article>
            ))}
          </div>

          {overview.itemLifecycleEvents.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-400">
              No item lifecycle audit events are currently recorded.
            </p>
          ) : null}
        </section>
      </section>
    </div>
  );
}
