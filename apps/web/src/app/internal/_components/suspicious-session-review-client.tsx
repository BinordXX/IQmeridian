'use client';

import { useMemo, useState } from 'react';

import {
  formatInternalDuration,
  getSuspiciousSessionRecords,
  sessionStatusLabels,
  sessionTypeLabels,
  suspiciousFlagStatusLabels,
  suspiciousSessionIndicatorLabels,
  type SuspiciousFlagStatus,
  type SuspiciousSessionIndicator,
} from '../_data/internal-tooling-data';

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

export function SuspiciousSessionReviewClient() {
  const [indicatorFilter, setIndicatorFilter] =
    useState<IndicatorFilter>('ALL');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');

  const suspiciousSessions = useMemo(() => getSuspiciousSessionRecords(), []);

  const filteredSessions = useMemo(
    () =>
      suspiciousSessions.filter((session) => {
        const matchesIndicator =
          indicatorFilter === 'ALL' ||
          session.suspiciousIndicators.includes(indicatorFilter);

        const matchesSeverity =
          severityFilter === 'ALL' ||
          session.suspiciousFlagStatus === severityFilter;

        return matchesIndicator && matchesSeverity;
      }),
    [indicatorFilter, severityFilter, suspiciousSessions]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Suspicious-session review</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Suspicious-session indicators are review signals, not proof of
          misconduct. Their value is in directing careful internal review toward
          timing, reconnect, access, omission, and submission patterns that may
          affect assessment interpretation.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Filter by indicator
          <select
            value={indicatorFilter}
            onChange={(event) =>
              setIndicatorFilter(event.target.value as IndicatorFilter)
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
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

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Filter by severity
          <select
            value={severityFilter}
            onChange={(event) =>
              setSeverityFilter(event.target.value as SeverityFilter)
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
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
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {session.sessionId}
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  {session.participantIdentifier}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {sessionTypeLabels[session.sessionType]} · {session.formLabel}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold">
                  {suspiciousFlagStatusLabels[session.suspiciousFlagStatus]}
                </span>
                <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold">
                  {sessionStatusLabels[session.status]}
                </span>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 text-sm md:grid-cols-4">
              <div className="rounded-xl bg-white px-4 py-3">
                <dt className="text-slate-500">Completion time</dt>
                <dd className="mt-1 font-semibold">
                  {formatInternalDuration(session.completionTimeMinutes)}
                </dd>
              </div>
              <div className="rounded-xl bg-white px-4 py-3">
                <dt className="text-slate-500">Refresh/reconnect</dt>
                <dd className="mt-1 font-semibold">
                  {session.refreshReconnectEvents}
                </dd>
              </div>
              <div className="rounded-xl bg-white px-4 py-3">
                <dt className="text-slate-500">Omission rate</dt>
                <dd className="mt-1 font-semibold">
                  {Math.round(session.omissionRate * 100)}%
                </dd>
              </div>
              <div className="rounded-xl bg-white px-4 py-3">
                <dt className="text-slate-500">Overall band</dt>
                <dd className="mt-1 font-semibold">
                  {session.overallBand ?? 'Not scored'}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              {session.suspiciousIndicators.map((indicator) => (
                <span
                  key={`${session.sessionId}-${indicator}`}
                  className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                >
                  {suspiciousSessionIndicatorLabels[indicator]}
                </span>
              ))}
            </div>

            <div className="mt-5 grid gap-3 text-sm lg:grid-cols-3">
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="font-semibold">Response timing</h4>
                <p className="mt-2 leading-6 text-slate-600">
                  {session.responseTimingPattern}
                </p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="font-semibold">Access anomaly</h4>
                <p className="mt-2 leading-6 text-slate-600">
                  {session.accessAnomaly}
                </p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="font-semibold">Submission pattern</h4>
                <p className="mt-2 leading-6 text-slate-600">
                  {session.submissionPattern}
                </p>
              </section>
            </div>
          </article>
        ))}

        {filteredSessions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
            No suspicious sessions match the current filters.
          </div>
        ) : null}
      </div>
    </section>
  );
}
