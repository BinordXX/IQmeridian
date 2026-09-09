import Link from 'next/link';

import { SuspiciousSessionReviewClient } from '../../../_components/suspicious-session-review-client';
import { fetchSuspiciousInternalSessions } from '../../../_lib/internal-api';

export default async function SuspiciousSessionsPage() {
  const sessions = await fetchSuspiciousInternalSessions();

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

        <Link
          href="/internal/admin/sessions"
          className="font-bold text-slate-500 underline-offset-4 hover:text-cyan-200 hover:underline"
        >
          Session review
        </Link>

        <span className="text-slate-600">/</span>

        <span className="font-black text-slate-300">Suspicious sessions</span>
      </nav>

      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Platform administration
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Suspicious-session review
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This screen reads suspicious-session records from the
            database-backed internal API. Under the current calibrated MVP
            rules, the present dev data may correctly return no suspicious
            sessions.
          </p>
        </div>
      </header>

      <SuspiciousSessionReviewClient sessions={sessions} />
    </div>
  );
}
