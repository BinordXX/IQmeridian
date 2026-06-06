import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ItemActionPanel } from '../../../_components/item-action-panel';
import {
  evaluateItemPerformancePatterns,
  formatCorrectRate,
  getInternalItemById,
  itemDomainLabels,
  itemStatusLabels,
  performancePatternLabels,
} from '../../../_data/internal-tooling-data';

export default async function InternalItemDetailPage({
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
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
          <span className="font-semibold text-slate-950">{item.id}</span>
        </nav>

        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Item detail
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {item.label}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This detail view brings together content, metadata, status
                history, form associations, performance indicators, and review
                notes so the item bank functions as a quality-control
                environment rather than a flat content table.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/internal/researcher/item-bank/${encodeURIComponent(
                  item.id
                )}/performance`}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                View performance
              </Link>

              {item.status === 'DRAFT' ? (
                <Link
                  href={`/internal/researcher/item-bank/edit?itemId=${encodeURIComponent(
                    item.id
                  )}`}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
                >
                  Edit draft
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Full item content</h2>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">Prompt</p>
                  <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {item.prompt}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">Options</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {item.options.map((option) => (
                      <div
                        key={option}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Correct answer
                  </p>
                  <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-950">
                    {item.correctAnswer}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Distractor rationale
                  </p>
                  <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {item.distractorRationale}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Status history</h2>

              <div className="mt-5 space-y-3">
                {item.statusHistory.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                  >
                    <p className="font-semibold text-slate-950">
                      {itemStatusLabels[entry.status]}
                    </p>
                    <p className="mt-1 text-slate-700">{entry.reason}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {entry.actor} · {entry.occurredAt}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Review notes</h2>

              <div className="mt-5 space-y-3">
                {item.reviewNotes.map((note) => (
                  <p
                    key={note}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                  >
                    {note}
                  </p>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Metadata</h2>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Item ID</dt>
                  <dd className="font-semibold">{item.id}</dd>
                </div>
                <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Domain</dt>
                  <dd className="font-semibold">
                    {itemDomainLabels[item.domain]}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Type</dt>
                  <dd className="font-semibold">{item.itemType}</dd>
                </div>
                <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-semibold">
                    {itemStatusLabels[item.status]}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Difficulty</dt>
                  <dd className="font-semibold">{item.difficultyEstimate}</dd>
                </div>
                <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Expected time</dt>
                  <dd className="font-semibold">
                    {item.timeExpectationSeconds}s
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Asset</dt>
                  <dd className="max-w-[220px] text-right font-semibold">
                    {item.assetLink ?? 'No asset linked'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Performance indicators</h2>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Exposure</dt>
                  <dd className="font-semibold">
                    {item.performance.exposureCount}
                  </dd>
                </div>
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Valid responses</dt>
                  <dd className="font-semibold">
                    {item.performance.validResponses}
                  </dd>
                </div>
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Correct rate</dt>
                  <dd className="font-semibold">
                    {formatCorrectRate(item.performance.correctResponseRate)}
                  </dd>
                </div>
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Omissions</dt>
                  <dd className="font-semibold">
                    {item.performance.omissionCount}
                  </dd>
                </div>
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">Average time</dt>
                  <dd className="font-semibold">
                    {item.performance.averageResponseTimeSeconds === null
                      ? 'No data'
                      : `${item.performance.averageResponseTimeSeconds}s`}
                  </dd>
                </div>
              </dl>

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
                  <span className="text-sm text-slate-600">
                    No current performance pattern.
                  </span>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Form associations</h2>

              {item.formAssociations.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  This item is not currently associated with an assessment form.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {item.formAssociations.map((association) => (
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
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {association.active ? 'Active form' : 'Inactive form'}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>

        <ItemActionPanel item={item} />
      </div>
    </main>
  );
}
