import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  evaluateItemPerformancePatterns,
  formatCorrectRate,
  getInternalItemById,
  itemDomainLabels,
  itemStatusLabels,
  performancePatternLabels,
} from '../../../../_data/internal-tooling-data';

export default async function InternalItemPerformancePage({
  params,
}: {
  params: Promise<{
    itemId: string;
  }>;
}) {
  const { itemId } = await params;
  const item = getInternalItemById(decodeURIComponent(itemId));

  if (!item) {
    notFound();
  }

  const performancePatterns = evaluateItemPerformancePatterns(item);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/internal" className="font-medium text-slate-600">
            Internal dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <Link
            href="/internal/researcher/item-bank"
            className="font-medium text-slate-600"
          >
            Item bank
          </Link>
          <span className="text-slate-400">/</span>
          <Link
            href={`/internal/researcher/item-bank/${encodeURIComponent(
              item.id
            )}`}
            className="font-medium text-slate-600"
          >
            {item.id}
          </Link>
          <span className="text-slate-400">/</span>
          <span className="font-semibold text-slate-950">Performance</span>
        </nav>

        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Item performance
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {item.label}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This view provides the first layer of operational evidence about
            whether an item is functioning plausibly. These indicators should be
            interpreted cautiously because exposure volume, candidate mix, form
            placement, and timing design all shape item behaviour.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Exposure count</p>
            <p className="mt-3 text-3xl font-semibold">
              {item.performance.exposureCount}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Valid responses
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {item.performance.validResponses}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Correct-response rate
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {formatCorrectRate(item.performance.correctResponseRate)}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Omissions</p>
            <p className="mt-3 text-3xl font-semibold">
              {item.performance.omissionCount}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Average response time
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {item.performance.averageResponseTimeSeconds === null
                ? '—'
                : `${item.performance.averageResponseTimeSeconds}s`}
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Operational interpretation
            </h2>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Indicator</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Interpretive caution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="px-4 py-4 font-medium">Exposure</td>
                    <td className="px-4 py-4">
                      {item.performance.exposureCount}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      Low exposure limits interpretability. High exposure may
                      increase content familiarity risk.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 font-medium">Correct rate</td>
                    <td className="px-4 py-4">
                      {formatCorrectRate(item.performance.correctResponseRate)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      Very low or very high values may indicate difficulty
                      mismatch, ambiguity, overexposure, or form-placement
                      effects.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 font-medium">Omissions</td>
                    <td className="px-4 py-4">
                      {item.performance.omissionCount}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      Higher omissions may indicate timing pressure, unclear
                      wording, excessive cognitive load, or interface friction.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 font-medium">Average time</td>
                    <td className="px-4 py-4">
                      {item.performance.averageResponseTimeSeconds === null
                        ? 'No data'
                        : `${item.performance.averageResponseTimeSeconds}s`}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      Longer times do not automatically mean better measurement;
                      they may reflect confusion or inefficient item design.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 font-medium">
                      Active form associations
                    </td>
                    <td className="px-4 py-4">
                      {item.performance.activeFormAssociations}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      Active placement matters because form context can shape
                      exposure, fatigue, and response behaviour.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Item context</h2>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Item ID</dt>
                  <dd className="font-semibold">{item.id}</dd>
                </div>
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Domain</dt>
                  <dd className="font-semibold">
                    {itemDomainLabels[item.domain]}
                  </dd>
                </div>
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-semibold">
                    {itemStatusLabels[item.status]}
                  </dd>
                </div>
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Difficulty</dt>
                  <dd className="font-semibold">{item.difficultyEstimate}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Detected patterns</h2>

              <div className="mt-5 flex flex-wrap gap-2">
                {performancePatterns.length > 0 ? (
                  performancePatterns.map((pattern) => (
                    <span
                      key={pattern}
                      className="rounded-full border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      {performancePatternLabels[pattern]}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">
                    No current performance pattern has been detected.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">
                Active form associations
              </h2>

              {item.formAssociations.filter((association) => association.active)
                .length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  This item has no active form association.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {item.formAssociations
                    .filter((association) => association.active)
                    .map((association) => (
                      <article
                        key={`${association.formId}-${association.position}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                      >
                        <p className="font-semibold text-slate-950">
                          {association.formLabel}
                        </p>
                        <p className="mt-1 text-slate-600">
                          Position {association.position} ·{' '}
                          {itemDomainLabels[association.section]}
                        </p>
                      </article>
                    ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
