import Link from 'next/link';

import { fetchReportScoreAuditRecords } from '../../_lib/internal-api';

export default async function InternalReportScoreAuditPage() {
  const records = await fetchReportScoreAuditRecords();

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
        <span className="font-black text-slate-300">
          Report and score audit
        </span>
      </nav>

      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Reproducibility audit
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Report and score audit visibility
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This view shows how reports and scores were generated, including
            scoring version, report version, report timestamp, visibility
            category, score state, and associated form/session context.
          </p>
        </div>
      </header>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead className="bg-[#020817]/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
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

              <tbody className="divide-y divide-white/10">
                {records.map((record) => (
                  <tr key={record.reportId} className="align-top">
                    <td className="px-4 py-4 font-black text-white">
                      {record.reportId}
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/internal/admin/sessions/${encodeURIComponent(
                          record.sessionId
                        )}`}
                        className="font-black text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline"
                      >
                        {record.sessionId}
                      </Link>
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {record.participantIdentifier}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-200">
                        {record.formId}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {record.formLabel}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {record.formVersion ?? 'Not recorded'}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {record.scoringVersion ?? 'Not scored'}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {record.reportVersion}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {record.reportGenerationTimestamp}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {record.reportType}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-1 text-xs font-black text-cyan-100">
                        {record.visibilityCategory}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-black text-cyan-100">
                      {record.overallBand ?? 'Not assigned'}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
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
              <div className="border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">
                No reports have been generated yet. This is a valid
                early-platform state until scoring and report generation are
                run.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
