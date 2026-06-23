import {
  BarChart3,
  ClipboardList,
  Database,
  FileText,
  FlaskConical,
  ScrollText,
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
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400"
    >
      <span
        className={[
          'flex h-12 w-12 items-center justify-center rounded-xl border',
          tone,
        ].join(' ')}
      >
        <Icon size={22} strokeWidth={2} />
      </span>

      <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
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

      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </article>
  );
};

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
          Researcher workspace
        </span>
      </nav>

      <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Researcher dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Psychometric readiness workspace
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Monitor item-bank quality, manage assessment forms, inspect pilot
            readiness, and request governed analytics exports for deeper
            psychometric review.
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
            href="/internal/researcher/exports"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Request export
          </Link>

          <Link
            href="/internal/researcher/performance"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Section/form analytics
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <WorkspaceLinkCard
          href="/internal/researcher/forms"
          eyebrow="Form management"
          title="Assessment forms"
          description="Create reusable assessment forms, define domain blueprints, and prepare forms for item placement, validation, locking, and pilot governance."
          icon={ClipboardList}
          tone="border-blue-100 bg-blue-50 text-blue-700"
        />

        <WorkspaceLinkCard
          href="/internal/researcher/pilot-forms"
          eyebrow="Pilot governance"
          title="Pilot forms"
          description="Validate pilot-form blueprints, inspect item-count gaps, control pilot status transitions, and lock forms when they are ready for controlled use."
          icon={FlaskConical}
          tone="border-emerald-100 bg-emerald-50 text-emerald-700"
        />

        <WorkspaceLinkCard
          href="/internal/researcher/exports"
          eyebrow="Research exports"
          title="Request analytics export"
          description="Request item-level, session-level, response-level, score-level, or campaign-summary datasets. Platform admins review and generate approved exports."
          icon={FileText}
          tone="border-violet-100 bg-violet-50 text-violet-700"
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
            tone="border-indigo-100 bg-indigo-50 text-indigo-700"
          />
        ))}

        {Object.keys(overview.totalItemsByStatus).length === 0 ? (
          <ResearchMetricCard
            label="Items"
            value={0}
            helper="No item records are available yet."
            icon={Database}
            tone="border-slate-200 bg-slate-50 text-slate-600"
          />
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Active items by domain
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Current active item distribution across the cognitive domains.
              </p>
            </div>

            <Link
              href="/internal/researcher/item-bank"
              className="w-fit rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              Review item bank
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {overview.activeItemsByDomain.map((domain) => (
              <div
                key={domain.domain}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="text-slate-600">
                  {itemDomainLabels[domain.domain] ?? domain.label}
                </span>
                <span className="font-semibold text-slate-950">
                  {domain.count}
                </span>
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
          <h2 className="text-lg font-semibold text-slate-950">
            Researcher indicators
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Operational signals used to monitor assessment readiness.
          </p>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Forms in use</dt>
              <dd className="font-semibold text-slate-950">
                {overview.formsInUse}
              </dd>
            </div>

            <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Recent session volume</dt>
              <dd className="font-semibold text-slate-950">
                {overview.recentSessionVolume}
              </dd>
            </div>

            <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Flagged sessions</dt>
              <dd className="font-semibold text-slate-950">
                {overview.flaggedSessionCount}
              </dd>
            </div>

            <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Average section time</dt>
              <dd className="font-semibold text-slate-950">
                {formatInternalDuration(overview.averageSectionCompletionTime)}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Items needing review
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Items surfaced for researcher attention based on current internal
              review thresholds.
            </p>
          </div>

          <Link
            href="/internal/researcher/item-bank"
            className="w-fit rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
          >
            Open all items
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {overview.itemsNeedingReview.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm md:flex-row md:items-start md:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-950">{item.id}</p>
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
