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
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Researcher tooling
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              Research export requests
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Request structured analytics exports and track whether each
              request is awaiting review, approved, declined, generated, failed,
              or ready to download.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/internal/researcher"
              className="rounded-full border border-white/10 bg-[#020817]/70 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
            >
              Researcher dashboard
            </Link>

            <Link
              href="/internal/researcher/item-bank"
              className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
            >
              Item bank
            </Link>
          </div>
        </div>
      </div>

      <section
        className={`rounded-[2rem] border p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] ${
          governanceSetting.approvalRequired
            ? 'border-amber-300/20 bg-amber-400/10'
            : 'border-emerald-300/20 bg-emerald-400/10'
        }`}
      >
        <p
          className={`text-xs font-black uppercase tracking-[0.2em] ${
            governanceSetting.approvalRequired
              ? 'text-amber-100'
              : 'text-emerald-100'
          }`}
        >
          Current export governance mode
        </p>

        <h2 className="mt-3 text-xl font-black text-white">
          {governanceSetting.approvalRequired
            ? 'Admin approval is required'
            : 'Auto-approval is enabled'}
        </h2>

        <p
          className={`mt-2 max-w-3xl text-sm leading-7 ${
            governanceSetting.approvalRequired
              ? 'text-amber-100'
              : 'text-emerald-100'
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
