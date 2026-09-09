import {
  ClipboardList,
  Database,
  FileText,
  type LucideIcon,
} from 'lucide-react';

import Link from 'next/link';

import {
  fetchResearcherDashboardOverview,
  formatInternalDuration,
  itemDomainLabels,
  itemStatusLabels,
} from '../_lib/internal-api';

const WorkspaceLinkCard = ({
  href,
  eyebrow,
  title,
  description,
  icon: Icon,
  tone,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}) => {
  return (
    <Link
      href={href}
      className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition hover:border-cyan-300/25 hover:bg-[#0b1d3f]/90"
    >
      <span
        className={[
          'flex h-12 w-12 items-center justify-center rounded-xl border',
          tone,
        ].join(' ')}
      >
        <Icon size={22} strokeWidth={2} />
      </span>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
    </Link>
  );
};

const ResearchMetricCard = ({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
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

      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </article>
  );
};

export default async function InternalResearcherDashboardPage() {
  const overview = await fetchResearcherDashboardOverview();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/internal"
          className="font-bold text-slate-500 underline-offset-4 hover:text-cyan-200 hover:underline"
        >
          Internal dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <span className="font-black text-slate-300">Researcher workspace</span>
      </nav>

      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Researcher dashboard
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              Psychometric readiness workspace
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Monitor item-bank quality, manage assessment forms, inspect pilot
              readiness, and request governed analytics exports for deeper
              psychometric review.
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
              href="/internal/researcher/exports"
              className="rounded-full border border-white/10 bg-[#020817]/70 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
            >
              Request export
            </Link>

            <Link
              href="/internal/researcher/performance"
              className="rounded-full border border-white/10 bg-[#020817]/70 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
            >
              Section/form analytics
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <WorkspaceLinkCard
          href="/internal/researcher/assignments"
          eyebrow="Assigned authoring"
          title="My section assignments"
          description="Create and submit assessment items only inside sections assigned to you by a platform administrator."
          icon={ClipboardList}
          tone="border-blue-300/20 bg-blue-400/10 text-blue-100"
        />

        <WorkspaceLinkCard
          href="/internal/researcher/item-bank"
          eyebrow="Existing research tools"
          title="Item bank"
          description="Review existing items and legacy item-bank records while the assignment-based authoring workflow becomes the primary route."
          icon={Database}
          tone="border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
        />

        <WorkspaceLinkCard
          href="/internal/researcher/exports"
          eyebrow="Research exports"
          title="Request analytics export"
          description="Request item-level, session-level, response-level, score-level, or campaign-summary datasets. Platform admins review and generate approved exports."
          icon={FileText}
          tone="border-violet-300/20 bg-violet-400/10 text-violet-100"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(overview.totalItemsByStatus).map(([status, count]) => (
          <ResearchMetricCard
            key={status}
            label={itemStatusLabels[status] ?? status}
            value={count}
            helper="Items by status"
            icon={Database}
            tone="border-indigo-300/20 bg-indigo-400/10 text-indigo-100"
          />
        ))}

        {Object.keys(overview.totalItemsByStatus).length === 0 ? (
          <ResearchMetricCard
            label="Items"
            value={0}
            helper="No item records are available yet."
            icon={Database}
            tone="border-white/10 bg-[#020817]/70 text-slate-300"
          />
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">
                Active items by domain
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Current active item distribution across the cognitive domains.
              </p>
            </div>

            <Link
              href="/internal/researcher/item-bank"
              className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15"
            >
              Review item bank
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {overview.activeItemsByDomain.map((domain) => (
              <div
                key={domain.domain}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3 text-sm"
              >
                <span className="text-slate-400">
                  {itemDomainLabels[domain.domain] ?? domain.label}
                </span>
                <span className="font-black text-white">{domain.count}</span>
              </div>
            ))}
          </div>

          {overview.activeItemsByDomain.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-500">
              No active item-domain data is available yet.
            </p>
          ) : null}
        </section>

        <aside className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <h2 className="text-lg font-black text-white">
            Researcher indicators
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Operational signals used to monitor assessment readiness.
          </p>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
              <dt className="text-slate-500">Forms in use</dt>
              <dd className="font-black text-white">{overview.formsInUse}</dd>
            </div>

            <div className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
              <dt className="text-slate-500">Recent session volume</dt>
              <dd className="font-black text-white">
                {overview.recentSessionVolume}
              </dd>
            </div>

            <div className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
              <dt className="text-slate-500">Flagged sessions</dt>
              <dd className="font-black text-white">
                {overview.flaggedSessionCount}
              </dd>
            </div>

            <div className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
              <dt className="text-slate-500">Average section time</dt>
              <dd className="font-black text-white">
                {formatInternalDuration(overview.averageSectionCompletionTime)}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">
              Items needing review
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              Items surfaced for researcher attention based on current internal
              review thresholds.
            </p>
          </div>

          <Link
            href="/internal/researcher/item-bank"
            className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15"
          >
            Open all items
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {overview.itemsNeedingReview.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm md:flex-row md:items-start md:justify-between"
            >
              <div>
                <p className="font-black text-white">{item.id}</p>
                <p className="mt-1 text-slate-400">{item.label}</p>
                <p className="mt-2 text-xs text-slate-500">{item.reason}</p>
              </div>

              <Link
                href={`/internal/researcher/item-bank/${encodeURIComponent(
                  item.id
                )}`}
                className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15"
              >
                Open item
              </Link>
            </article>
          ))}
        </div>

        {overview.itemsNeedingReview.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-500">
            No items currently meet the review threshold.
          </p>
        ) : null}
      </section>
    </div>
  );
}
