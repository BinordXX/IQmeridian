import Link from 'next/link';

import { AdminDirectExportClient } from '../../_components/admin-direct-export-client';
import { AnalyticsExportReviewClient } from '../../_components/analytics-export-review-client';
import { ExportGovernanceSettingsClient } from '../../_components/export-governance-settings-client';
import {
  fetchAnalyticsExportDefinitions,
  fetchAnalyticsExportGovernanceSetting,
  fetchAnalyticsExportRequests,
} from '../../_lib/internal-api';

export default async function InternalAdminExportsPage() {
  const [definitions, requests, governanceSetting] = await Promise.all([
    fetchAnalyticsExportDefinitions(),
    fetchAnalyticsExportRequests(),
    fetchAnalyticsExportGovernanceSetting(),
  ]);

  const pendingRequestCount = requests.filter(
    (request) => request.status === 'REQUESTED'
  ).length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
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
              Export governance
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Review researcher export requests, approve or decline access,
              generate approved exports, manage the approval requirement, and
              perform direct platform-admin exports when governance allows.
              Every request, decision, generation, download, and setting change
              is auditable.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/internal/admin"
              className="rounded-full border border-white/10 bg-[#020817]/70 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
            >
              Admin dashboard
            </Link>

            <Link
              href="/internal/researcher/exports"
              className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
            >
              Researcher export view
            </Link>
          </div>
        </div>
      </div>

      {pendingRequestCount > 0 ? (
        <section className="rounded-[2rem] border border-amber-300/20 bg-amber-400/10 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">
            Pending admin action
          </p>

          <h2 className="mt-3 text-xl font-black text-white">
            {pendingRequestCount} export request
            {pendingRequestCount === 1 ? '' : 's'} awaiting review
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-7 text-amber-100">
            Review the approval queue below. Requested exports cannot be
            generated or downloaded until a platform admin approves them.
          </p>
        </section>
      ) : null}

      <ExportGovernanceSettingsClient initialSetting={governanceSetting} />

      <AdminDirectExportClient definitions={definitions} />

      <AnalyticsExportReviewClient
        definitions={definitions}
        initialRequests={requests}
      />
    </main>
  );
}
