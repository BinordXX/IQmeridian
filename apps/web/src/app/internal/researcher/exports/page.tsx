import Link from 'next/link';

import { AnalyticsExportClient } from '../../_components/analytics-export-client';
import {
  fetchAnalyticsExportDefinitions,
  fetchAnalyticsExportGovernanceSetting,
  fetchAnalyticsExportRequests,
} from '../../_lib/internal-api';

export default async function InternalResearcherExportsPage() {
  const [definitions, requests, governanceSetting] = await Promise.all([
    fetchAnalyticsExportDefinitions(),
    fetchAnalyticsExportRequests(),
    fetchAnalyticsExportGovernanceSetting(),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Researcher tooling
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Research export requests
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Request structured analytics exports and track whether each request
            is awaiting review, approved, declined, generated, failed, or ready
            to download.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/internal/researcher"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Researcher dashboard
          </Link>

          <Link
            href="/internal/researcher/item-bank"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Item bank
          </Link>
        </div>
      </div>

      <section
        className={`rounded-2xl border p-5 shadow-sm ${
          governanceSetting.approvalRequired
            ? 'border-amber-200 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}
      >
        <p
          className={`text-sm font-semibold uppercase tracking-wide ${
            governanceSetting.approvalRequired
              ? 'text-amber-800'
              : 'text-emerald-800'
          }`}
        >
          Current export governance mode
        </p>
        <h2
          className={`mt-2 text-xl font-semibold ${
            governanceSetting.approvalRequired
              ? 'text-amber-950'
              : 'text-emerald-950'
          }`}
        >
          {governanceSetting.approvalRequired
            ? 'Admin approval is required'
            : 'Auto-approval is enabled'}
        </h2>
        <p
          className={`mt-2 max-w-3xl text-sm leading-6 ${
            governanceSetting.approvalRequired
              ? 'text-amber-900'
              : 'text-emerald-900'
          }`}
        >
          {governanceSetting.approvalRequired
            ? 'Export requests will enter the admin approval queue. A platform admin must approve and generate the export before it becomes available for download.'
            : 'Export requests are automatically approved and generated. The generated export should appear in your request history immediately after submission.'}
        </p>
      </section>

      <AnalyticsExportClient
        definitions={definitions}
        initialRequests={requests}
        governanceSetting={governanceSetting}
      />
    </main>
  );
}
