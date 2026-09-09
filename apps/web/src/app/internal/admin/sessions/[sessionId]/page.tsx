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

const getSuspiciousStatusClassName = (status: string) => {
  if (status === 'HIGH') {
    return 'border-red-300/20 bg-red-400/10 text-red-100';
  }

  if (status === 'MEDIUM') {
    return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
  }

  if (status === 'LOW') {
    return 'border-blue-300/20 bg-blue-400/10 text-blue-100';
  }

  return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
};

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

        <span className="break-all font-black text-slate-300">
          {session.sessionId}
        </span>
      </nav>

      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Session detail
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            {session.participantIdentifier}
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This detail page reads the selected session from the internal API.
            Timing, omissions, scoring outcome, interruption history, and
            suspicious flags are derived from database-backed records.
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Session metadata</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Session ID</dt>
                <dd className="max-w-[220px] break-all text-right font-black text-white">
                  {session.sessionId}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Type</dt>
                <dd className="text-right font-black text-white">
                  {sessionTypeLabels[session.sessionType]}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Form</dt>
                <dd className="break-all text-right font-black text-white">
                  {session.formId}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Status</dt>
                <dd className="text-right font-black text-white">
                  {session.status}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Completion</dt>
                <dd className="text-right font-black text-white">
                  {completionStatusLabels[session.completionStatus]}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Timing profile</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Started</dt>
                <dd className="mt-1 font-black text-white">
                  {session.startedAt ?? 'Not started'}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Ended</dt>
                <dd className="mt-1 font-black text-white">
                  {session.endedAt ?? 'Still open'}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Completion time</dt>
                <dd className="mt-1 font-black text-white">
                  {formatInternalDuration(session.completionTimeMinutes)}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Refresh/reconnect events</dt>
                <dd className="mt-1 font-black text-white">
                  {session.refreshReconnectEvents}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Scoring outcome</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Overall band</dt>
                <dd className="font-black text-cyan-100">
                  {session.overallBand ?? 'Not scored'}
                </dd>
              </div>

              <div className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Omission rate</dt>
                <dd className="font-black text-white">
                  {formatOmissionRate(session.omissionRate)}
                </dd>
              </div>
            </dl>

            <p className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm leading-7 text-slate-400">
              {session.scoringOutcome}
            </p>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Flag reason or rule trigger
                </h2>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  These rule-based triggers are derived by the internal API from
                  session timing, response, omission, and audit data.
                </p>
              </div>

              <span
                className={`w-fit rounded-full border px-3 py-1 text-sm font-black ${getSuspiciousStatusClassName(
                  session.suspiciousFlagStatus
                )}`}
              >
                {suspiciousFlagStatusLabels[session.suspiciousFlagStatus]}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {session.suspiciousIndicators.length > 0 ? (
                session.suspiciousIndicators.map((indicator) => (
                  <span
                    key={indicator}
                    className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-100"
                  >
                    {suspiciousSessionIndicatorLabels[indicator]}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No suspicious-session indicator is currently attached.
                </p>
              )}
            </div>

            {session.suspiciousFlagReasons.length > 0 ? (
              <div className="mt-5 space-y-2">
                {session.suspiciousFlagReasons.map((reason) => (
                  <p
                    key={reason}
                    className="rounded-2xl border border-white/10 bg-[#020817]/70 p-3 text-sm text-slate-400"
                  >
                    {reason}
                  </p>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">
              Response pattern summary
            </h2>

            <p className="mt-4 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm leading-7 text-slate-400">
              {session.responsePatternSummary}
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">
              Interruption history
            </h2>

            <div className="mt-5 space-y-3">
              {session.interruptionHistory.map((entry) => (
                <p
                  key={entry}
                  className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm leading-7 text-slate-400"
                >
                  {entry}
                </p>
              ))}

              {session.interruptionHistory.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-500">
                  No interruption history is currently recorded for this
                  session.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Reviewer notes</h2>

            <div className="mt-5 space-y-3">
              {session.reviewerNotes.map((note) => (
                <p
                  key={note}
                  className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm leading-7 text-slate-400"
                >
                  {note}
                </p>
              ))}

              {session.reviewerNotes.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-500">
                  No reviewer note has been recorded for this session.
                </p>
              ) : null}
            </div>

            <textarea
              rows={6}
              placeholder="Add internal review notes..."
              className="mt-5 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
            />
          </section>
        </div>
      </section>
    </div>
  );
}
