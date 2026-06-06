import Link from 'next/link';

import {
  completionStatusLabels,
  formatInternalDuration,
  internalSessionReviewRecords,
  sessionStatusLabels,
  sessionTypeLabels,
  suspiciousFlagStatusLabels,
} from '../../_data/internal-tooling-data';

export default function InternalSessionReviewPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/internal" className="font-medium text-slate-600">
            Internal dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <span className="font-semibold text-slate-950">Session review</span>
        </nav>

        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Platform administration
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Session review
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              This page gives internal users access to the behavioural record of
              platform usage. It includes completed and in-progress sessions,
              form usage, completion state, score band, and suspicious flag
              status.
            </p>
          </div>

          <Link
            href="/internal/admin/sessions/suspicious"
            className="w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Review suspicious sessions
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
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
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {internalSessionReviewRecords.map((session) => (
                  <tr key={session.sessionId} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-950">
                        {session.participantIdentifier}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {session.sessionId}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {sessionTypeLabels[session.sessionType]}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{session.formId}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {session.formLabel}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {sessionStatusLabels[session.status]}
                    </td>
                    <td className="px-4 py-4">{session.startedAt}</td>
                    <td className="px-4 py-4">
                      {session.endedAt ?? 'Still open'}
                    </td>
                    <td className="px-4 py-4">
                      {completionStatusLabels[session.completionStatus]}
                    </td>
                    <td className="px-4 py-4">
                      {formatInternalDuration(session.completionTimeMinutes)}
                    </td>
                    <td className="px-4 py-4">
                      {session.overallBand ?? 'Not scored'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold">
                        {
                          suspiciousFlagStatusLabels[
                            session.suspiciousFlagStatus
                          ]
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
