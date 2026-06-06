import Link from 'next/link';

import { SuspiciousSessionReviewClient } from '../../../_components/suspicious-session-review-client';
import { fetchSuspiciousInternalSessions } from '../../../_lib/internal-api';

export default async function SuspiciousSessionsPage() {
  const sessions = await fetchSuspiciousInternalSessions();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/internal" className="font-medium text-slate-600">
          Internal dashboard
        </Link>
        <span className="text-slate-400">/</span>
        <Link
          href="/internal/admin/sessions"
          className="font-medium text-slate-600"
        >
          Session review
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-950">
          Suspicious sessions
        </span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Platform administration
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Suspicious-session review
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This screen now reads suspicious-session records from the
          database-backed internal API. Under the current calibrated MVP rules,
          the present dev data may correctly return no suspicious sessions.
        </p>
      </header>

      <SuspiciousSessionReviewClient sessions={sessions} />
    </div>
  );
}
