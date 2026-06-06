import Link from 'next/link';

import { AnalyticsExportClient } from '../../_components/analytics-export-client';
import { fetchAnalyticsExportDefinitions } from '../../_lib/internal-api';

export default async function InternalAnalyticsExportPage() {
  const definitions = await fetchAnalyticsExportDefinitions();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/internal" className="font-medium text-slate-600">
          Internal dashboard
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-950">Analytics exports</span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Platform administration
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Analytics export screen
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Export definitions are now loaded from the database-backed internal
          API surface rather than from frontend mock data.
        </p>
      </header>

      <AnalyticsExportClient definitions={definitions} />
    </div>
  );
}
