import Link from 'next/link';

import { fetchReportScoreAuditRecords } from '../../_lib/internal-api';

export default async function InternalReportScoreAuditPage() {
  const records = await fetchReportScoreAuditRecords();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/internal" className="font-medium text-slate-600">
          Internal dashboard
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-950">
          Report and score audit
        </span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Reproducibility audit
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Report and score audit visibility
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This view shows how reports and scores were generated, including
          scoring version, report version, report timestamp, visibility
          category, score state, and associated form/session context.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Report</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">Form</th>
                <th className="px-4 py-3">Form version</th>
                <th className="px-4 py-3">Scoring version</th>
                <th className="px-4 py-3">Report version</th>
                <th className="px-4 py-3">Generated</th>
                <th className="px-4 py-3">Report type</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Overall band</th>
                <th className="px-4 py-3">Overall score</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {records.map((record) => (
                <tr key={record.reportId} className="align-top">
                  <td className="px-4 py-4 font-semibold">{record.reportId}</td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/internal/admin/sessions/${encodeURIComponent(
                        record.sessionId
                      )}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {record.sessionId}
                    </Link>
                  </td>
                  <td className="px-4 py-4">{record.participantIdentifier}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{record.formId}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.formLabel}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {record.formVersion ?? 'Not recorded'}
                  </td>
                  <td className="px-4 py-4">
                    {record.scoringVersion ?? 'Not scored'}
                  </td>
                  <td className="px-4 py-4">{record.reportVersion}</td>
                  <td className="px-4 py-4">
                    {record.reportGenerationTimestamp}
                  </td>
                  <td className="px-4 py-4">{record.reportType}</td>
                  <td className="px-4 py-4">{record.visibilityCategory}</td>
                  <td className="px-4 py-4">
                    {record.overallBand ?? 'Not assigned'}
                  </td>
                  <td className="px-4 py-4">
                    {record.overallRawScore === null ||
                    record.overallMaxScore === null
                      ? 'Not available'
                      : `${record.overallRawScore}/${record.overallMaxScore}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {records.length === 0 ? (
            <div className="bg-white px-4 py-8 text-center text-sm text-slate-600">
              No reports have been generated yet. This is a valid early-platform
              state until scoring and report generation are run.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
