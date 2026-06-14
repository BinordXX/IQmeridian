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
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Platform administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Export governance
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Review researcher export requests, approve or decline access,
            generate approved exports, manage the approval requirement, and
            perform direct platform-admin exports when governance allows. Every
            request, decision, generation, download, and setting change is
            auditable.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/internal/admin"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Admin dashboard
          </Link>

          <Link
            href="/internal/researcher/exports"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Researcher export view
          </Link>
        </div>
      </div>

      {pendingRequestCount > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            Pending admin action
          </p>
          <h2 className="mt-2 text-xl font-semibold text-amber-950">
            {pendingRequestCount} export request
            {pendingRequestCount === 1 ? '' : 's'} awaiting review
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
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
