import Link from 'next/link';

import {
  fetchFormPerformanceSummaries,
  fetchSectionPerformanceSummaries,
  formatInternalDuration,
  formatInternalRate,
} from '../../_lib/internal-api';

export default async function InternalSectionAndFormPerformancePage() {
  const [sectionPerformance, formPerformance] = await Promise.all([
    fetchSectionPerformanceSummaries(),
    fetchFormPerformanceSummaries(),
  ]);

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
          Section and form performance
        </span>
      </nav>

      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Researcher analytics
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Section- and form-level performance
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This view reads section and form aggregates from the internal API.
            It helps distinguish isolated item problems from broader form
            design, timing, completion, or score-spread issues.
          </p>
        </div>
      </header>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <h2 className="text-lg font-black text-white">
          Section performance summary
        </h2>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-[#020817]/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Completion rate</th>
                <th className="px-4 py-3">Average score</th>
                <th className="px-4 py-3">Average time</th>
                <th className="px-4 py-3">Score distribution</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10 bg-[#020817]/45">
              {sectionPerformance.map((section) => (
                <tr
                  key={section.section}
                  className="align-top transition hover:bg-cyan-400/[0.04]"
                >
                  <td className="px-4 py-4 font-black text-white">
                    {section.sectionLabel}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {section.startedSessions}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {section.completedSessions}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {formatInternalRate(section.completionRate)}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {section.averageScorePercent}%
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {formatInternalDuration(
                      section.averageCompletionTimeMinutes
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {section.scoreDistribution.map((bucket) => (
                        <span
                          key={`${section.section}-${bucket.label}`}
                          className="rounded-full border border-white/10 bg-[#07142f]/80 px-2 py-1 text-xs font-bold text-slate-300"
                        >
                          {bucket.label}: {bucket.count}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sectionPerformance.length === 0 ? (
            <div className="border-t border-white/10 bg-[#020817]/70 px-4 py-8 text-center text-sm text-slate-500">
              No section-performance data is available yet.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <h2 className="text-lg font-black text-white">
          Form performance summary
        </h2>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {formPerformance.map((form) => (
            <article
              key={form.formId}
              className="rounded-[1.5rem] border border-white/10 bg-[#020817]/70 p-5"
            >
              <p className="break-all text-sm font-bold text-slate-500">
                {form.formId}
              </p>

              <h3 className="mt-2 text-lg font-black text-white">
                {form.formLabel}
              </h3>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                  <dt className="text-slate-500">Started</dt>
                  <dd className="font-black text-white">
                    {form.startedSessions}
                  </dd>
                </div>

                <div className="flex justify-between rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                  <dt className="text-slate-500">Completed</dt>
                  <dd className="font-black text-white">
                    {form.completedSessions}
                  </dd>
                </div>

                <div className="flex justify-between rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                  <dt className="text-slate-500">Completion rate</dt>
                  <dd className="font-black text-white">
                    {formatInternalRate(form.completionRate)}
                  </dd>
                </div>

                <div className="flex justify-between rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                  <dt className="text-slate-500">Average time</dt>
                  <dd className="font-black text-white">
                    {formatInternalDuration(form.averageCompletionTimeMinutes)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <p className="text-sm font-bold text-slate-500">Score spread</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {form.scoreSpread.map((bucket) => (
                    <span
                      key={`${form.formId}-${bucket.label}`}
                      className="rounded-full border border-white/10 bg-[#07142f]/80 px-2 py-1 text-xs font-bold text-slate-300"
                    >
                      {bucket.label}: {bucket.count}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {formPerformance.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-8 text-center text-sm text-slate-500">
            No form-performance data is available yet.
          </div>
        ) : null}
      </section>
    </div>
  );
}
