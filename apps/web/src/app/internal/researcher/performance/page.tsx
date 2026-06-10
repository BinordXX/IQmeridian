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
        <Link href="/internal" className="font-medium text-slate-600">
          Internal dashboard
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-950">
          Section and form performance
        </span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Researcher analytics
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Section- and form-level performance
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This view now reads section and form aggregates from the internal API.
          It helps distinguish isolated item problems from broader form design,
          timing, completion, or score-spread issues.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Section performance summary</h2>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
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

            <tbody className="divide-y divide-slate-200 bg-white">
              {sectionPerformance.map((section) => (
                <tr key={section.section} className="align-top">
                  <td className="px-4 py-4 font-semibold">
                    {section.sectionLabel}
                  </td>
                  <td className="px-4 py-4">{section.startedSessions}</td>
                  <td className="px-4 py-4">{section.completedSessions}</td>
                  <td className="px-4 py-4">
                    {formatInternalRate(section.completionRate)}
                  </td>
                  <td className="px-4 py-4">{section.averageScorePercent}%</td>
                  <td className="px-4 py-4">
                    {formatInternalDuration(
                      section.averageCompletionTimeMinutes
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {section.scoreDistribution.map((bucket) => (
                        <span
                          key={`${section.section}-${bucket.label}`}
                          className="rounded-full border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
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
            <div className="bg-white px-4 py-8 text-center text-sm text-slate-600">
              No section-performance data is available yet.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Form performance summary</h2>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {formPerformance.map((form) => (
            <article
              key={form.formId}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-sm font-semibold text-slate-500">
                {form.formId}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{form.formLabel}</h3>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between rounded-xl bg-white px-4 py-3">
                  <dt className="text-slate-500">Started</dt>
                  <dd className="font-semibold">{form.startedSessions}</dd>
                </div>
                <div className="flex justify-between rounded-xl bg-white px-4 py-3">
                  <dt className="text-slate-500">Completed</dt>
                  <dd className="font-semibold">{form.completedSessions}</dd>
                </div>
                <div className="flex justify-between rounded-xl bg-white px-4 py-3">
                  <dt className="text-slate-500">Completion rate</dt>
                  <dd className="font-semibold">
                    {formatInternalRate(form.completionRate)}
                  </dd>
                </div>
                <div className="flex justify-between rounded-xl bg-white px-4 py-3">
                  <dt className="text-slate-500">Average time</dt>
                  <dd className="font-semibold">
                    {formatInternalDuration(form.averageCompletionTimeMinutes)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  Score spread
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.scoreSpread.map((bucket) => (
                    <span
                      key={`${form.formId}-${bucket.label}`}
                      className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
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
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
            No form-performance data is available yet.
          </div>
        ) : null}
      </section>
    </div>
  );
}
