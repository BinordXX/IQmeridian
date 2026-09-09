import Link from 'next/link';

import {
  completionStatusLabels,
  fetchInternalSessions,
  formatInternalDuration,
  sessionTypeLabels,
  suspiciousFlagStatusLabels,
} from '../../_lib/internal-api';

export default async function InternalSessionReviewPage() {
  const sessions = await fetchInternalSessions();

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
        <span className="font-black text-slate-300">Session review</span>
      </nav>

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
              Session review
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              This page reads session review records from the internal API,
              which derives its data from Prisma-backed sessions, responses,
              scores, forms, campaigns, users, and audit logs.
            </p>
          </div>

          <Link
            href="/internal/admin/sessions/suspicious"
            className="w-fit rounded-full border border-amber-300/25 bg-amber-400/15 px-4 py-2 text-sm font-black text-amber-50 transition hover:bg-amber-400/20"
          >
            Review suspicious sessions
          </Link>
        </div>
      </header>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-[#020817]/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Session type</th>
                  <th className="px-4 py-3">Form used</th>
                  <th className="px-4 py-3">Session status</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Ended</th>
                  <th className="px-4 py-3">Completion</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Overall band</th>
                  <th className="px-4 py-3">Suspicious flag</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {sessions.map((session) => (
                  <tr key={session.sessionId} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-black text-white">
                        {session.participantIdentifier}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {session.sessionId}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {sessionTypeLabels[session.sessionType]}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-200">
                        {session.formId}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {session.formLabel}
                      </p>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-300">
                      {session.status}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {session.startedAt ?? 'Not started'}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {session.endedAt ?? 'Still open'}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {completionStatusLabels[session.completionStatus]}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {formatInternalDuration(session.completionTimeMinutes)}
                    </td>

                    <td className="px-4 py-4 font-black text-cyan-100">
                      {session.overallBand ?? 'Not scored'}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-xs font-black text-amber-100">
                        {
                          suspiciousFlagStatusLabels[
                            session.suspiciousFlagStatus
                          ]
                        }
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/internal/admin/sessions/${encodeURIComponent(
                          session.sessionId
                        )}`}
                        className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15"
                      >
                        Open detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sessions.length === 0 ? (
              <div className="border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">
                No sessions were returned by the internal API.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
