'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  formatInternalDuration,
  formatOmissionRate,
  sessionTypeLabels,
  suspiciousFlagStatusLabels,
  suspiciousSessionIndicatorLabels,
  type InternalSessionOutput,
  type SuspiciousFlagStatus,
  type SuspiciousSessionIndicator,
} from '../_lib/internal-api';

type IndicatorFilter = 'ALL' | SuspiciousSessionIndicator;
type SeverityFilter = 'ALL' | Exclude<SuspiciousFlagStatus, 'NONE'>;

const indicatorOptions: IndicatorFilter[] = [
  'ALL',
  'UNUSUALLY_SHORT_COMPLETION_TIME',
  'REPEATED_REFRESH_RECONNECT',
  'ABNORMAL_RESPONSE_TIMING',
  'DUPLICATE_ACCESS_ANOMALY',
  'INCONSISTENT_SUBMISSION_PATTERN',
  'EXTREME_OMISSION_BEHAVIOUR',
];

const severityOptions: SeverityFilter[] = ['ALL', 'LOW', 'MEDIUM', 'HIGH'];

const getSeverityBadgeClassName = (severity: SuspiciousFlagStatus) => {
  if (severity === 'HIGH') {
    return 'border-red-300/20 bg-red-400/10 text-red-100';
  }

  if (severity === 'MEDIUM') {
    return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
  }

  if (severity === 'LOW') {
    return 'border-blue-300/20 bg-blue-400/10 text-blue-100';
  }

  return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
};

export function SuspiciousSessionReviewClient({
  sessions,
}: {
  sessions: InternalSessionOutput[];
}) {
  const [indicatorFilter, setIndicatorFilter] =
    useState<IndicatorFilter>('ALL');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');

  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) => {
        const matchesIndicator =
          indicatorFilter === 'ALL' ||
          session.suspiciousIndicators.includes(indicatorFilter);

        const matchesSeverity =
          severityFilter === 'ALL' ||
          session.suspiciousFlagStatus === severityFilter;

        return matchesIndicator && matchesSeverity;
      }),
    [indicatorFilter, severityFilter, sessions]
  );

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div>
        <h2 className="text-xl font-black text-white">
          Suspicious-session review
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          This list is populated from the internal API. If no sessions appear,
          the backend found no currently suspicious sessions under the
          calibrated MVP rules.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
          Filter by indicator
          <select
            value={indicatorFilter}
            onChange={(event) =>
              setIndicatorFilter(event.target.value as IndicatorFilter)
            }
            className="min-h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
          >
            {indicatorOptions.map((indicator) => (
              <option key={indicator} value={indicator}>
                {indicator === 'ALL'
                  ? 'All suspicious indicators'
                  : suspiciousSessionIndicatorLabels[indicator]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
          Filter by severity
          <select
            value={severityFilter}
            onChange={(event) =>
              setSeverityFilter(event.target.value as SeverityFilter)
            }
            className="min-h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
          >
            {severityOptions.map((severity) => (
              <option key={severity} value={severity}>
                {severity === 'ALL'
                  ? 'All severities'
                  : suspiciousFlagStatusLabels[severity]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 space-y-4">
        {filteredSessions.map((session) => (
          <article
            key={session.sessionId}
            className="rounded-[1.5rem] border border-white/10 bg-[#020817]/70 p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="break-all text-sm font-bold text-slate-500">
                  {session.sessionId}
                </p>

                <h3 className="mt-1 text-lg font-black text-white">
                  {session.participantIdentifier}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  {sessionTypeLabels[session.sessionType]} · {session.formLabel}
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <span
                  className={`w-fit rounded-full border px-2 py-1 text-xs font-black ${getSeverityBadgeClassName(
                    session.suspiciousFlagStatus
                  )}`}
                >
                  {suspiciousFlagStatusLabels[session.suspiciousFlagStatus]}
                </span>

                <Link
                  href={`/internal/admin/sessions/${encodeURIComponent(
                    session.sessionId
                  )}`}
                  className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  Open detail review
                </Link>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 text-sm md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                <dt className="text-slate-500">Completion time</dt>
                <dd className="mt-1 font-black text-white">
                  {formatInternalDuration(session.completionTimeMinutes)}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                <dt className="text-slate-500">Refresh/reconnect</dt>
                <dd className="mt-1 font-black text-white">
                  {session.refreshReconnectEvents}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                <dt className="text-slate-500">Omission rate</dt>
                <dd className="mt-1 font-black text-white">
                  {formatOmissionRate(session.omissionRate)}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                <dt className="text-slate-500">Overall band</dt>
                <dd className="mt-1 font-black text-cyan-100">
                  {session.overallBand ?? 'Not scored'}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              {session.suspiciousIndicators.map((indicator) => (
                <span
                  key={`${session.sessionId}-${indicator}`}
                  className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-100"
                >
                  {suspiciousSessionIndicatorLabels[indicator]}
                </span>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#07142f]/80 p-4 text-sm">
              <h4 className="font-black text-white">Response pattern</h4>

              <p className="mt-2 leading-7 text-slate-400">
                {session.responsePatternSummary}
              </p>
            </div>
          </article>
        ))}

        {filteredSessions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-8 text-center text-sm text-slate-500">
            No suspicious sessions match the current filters.
          </div>
        ) : null}
      </div>
    </section>
  );
}
