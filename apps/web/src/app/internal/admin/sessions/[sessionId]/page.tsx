import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  completionStatusLabels,
  fetchInternalSessionById,
  formatInternalDuration,
  formatOmissionRate,
  sessionTypeLabels,
  suspiciousFlagStatusLabels,
  suspiciousSessionIndicatorLabels,
} from '../../../_lib/internal-api';

export default async function SuspiciousSessionDetailPage({
  params,
}: {
  params: Promise<{
    sessionId: string;
  }>;
}) {
  const { sessionId } = await params;

  const session = await fetchInternalSessionById(decodeURIComponent(sessionId))
    .then((record) => record)
    .catch(() => null);

  if (!session) {
    notFound();
  }

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
          {session.sessionId}
        </span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Session detail
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {session.participantIdentifier}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This detail page now reads the selected session from the internal API.
          Timing, omissions, scoring outcome, interruption history, and
          suspicious flags are derived from database-backed records.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Session metadata</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Session ID</dt>
                <dd className="max-w-[220px] text-right font-semibold">
                  {session.sessionId}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Type</dt>
                <dd className="font-semibold">
                  {sessionTypeLabels[session.sessionType]}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Form</dt>
                <dd className="font-semibold">{session.formId}</dd>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-semibold">{session.status}</dd>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Completion</dt>
                <dd className="font-semibold">
                  {completionStatusLabels[session.completionStatus]}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Timing profile</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Started</dt>
                <dd className="mt-1 font-semibold">
                  {session.startedAt ?? 'Not started'}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Ended</dt>
                <dd className="mt-1 font-semibold">
                  {session.endedAt ?? 'Still open'}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Completion time</dt>
                <dd className="mt-1 font-semibold">
                  {formatInternalDuration(session.completionTimeMinutes)}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Refresh/reconnect events</dt>
                <dd className="mt-1 font-semibold">
                  {session.refreshReconnectEvents}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Scoring outcome</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Overall band</dt>
                <dd className="font-semibold">
                  {session.overallBand ?? 'Not scored'}
                </dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Omission rate</dt>
                <dd className="font-semibold">
                  {formatOmissionRate(session.omissionRate)}
                </dd>
              </div>
            </dl>

            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {session.scoringOutcome}
            </p>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Flag reason or rule trigger
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  These rule-based triggers are derived by the internal API from
                  session timing, response, omission, and audit data.
                </p>
              </div>

              <span className="w-fit rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold">
                {suspiciousFlagStatusLabels[session.suspiciousFlagStatus]}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {session.suspiciousIndicators.length > 0 ? (
                session.suspiciousIndicators.map((indicator) => (
                  <span
                    key={indicator}
                    className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    {suspiciousSessionIndicatorLabels[indicator]}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  No suspicious-session indicator is currently attached.
                </p>
              )}
            </div>

            {session.suspiciousFlagReasons.length > 0 ? (
              <div className="mt-5 space-y-2">
                {session.suspiciousFlagReasons.map((reason) => (
                  <p
                    key={reason}
                    className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
                  >
                    {reason}
                  </p>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Response pattern summary</h2>
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {session.responsePatternSummary}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Interruption history</h2>

            <div className="mt-5 space-y-3">
              {session.interruptionHistory.map((entry) => (
                <p
                  key={entry}
                  className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                >
                  {entry}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Reviewer notes</h2>

            <div className="mt-5 space-y-3">
              {session.reviewerNotes.map((note) => (
                <p
                  key={note}
                  className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                >
                  {note}
                </p>
              ))}
            </div>

            <textarea
              rows={6}
              placeholder="Add internal review notes..."
              className="mt-5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            />
          </section>
        </div>
      </section>
    </div>
  );
}
