import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ItemStatusActionsClient } from '../../../_components/item-status-actions-client';
import {
  fetchInternalItemById,
  formatCorrectRate,
  formatJsonValue,
  itemDomainLabels,
  itemStatusLabels,
} from '../../../_lib/internal-api';

export default async function InternalItemDetailPage({
  params,
}: {
  params: Promise<{
    itemId: string;
  }>;
}) {
  const { itemId } = await params;

  const item = await fetchInternalItemById(decodeURIComponent(itemId))
    .then((record) => record)
    .catch(() => null);

  if (!item) {
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
              This detail view now reads item content, form associations,
              performance indicators, and audit-derived history from the
              internal API.
            </p>
          </div>

          <Link
            href={`/internal/researcher/item-bank/${encodeURIComponent(
              item.id
            )}/performance`}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            View performance
          </Link>
          <Link
            href={`/internal/researcher/item-bank/${encodeURIComponent(
              item.id
            )}/traceability`}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            View traceability
          </Link>
          {item.status === 'DRAFT' ? (
            <Link
              href={`/internal/researcher/item-bank/${encodeURIComponent(item.id)}/edit`}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Edit draft
            </Link>
          ) : null}

          <Link
            href={`/internal/researcher/item-bank/${encodeURIComponent(
              item.id
            )}/attach-form`}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Attach to form
          </Link>
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
                <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {formatJsonValue(item.options)}
                </pre>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Correct answer
                </p>
                <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-950">
                  {formatJsonValue(item.correctAnswer)}
                </pre>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Status history</h2>

            <div className="mt-5 space-y-3">
              {item.statusHistory.length > 0 ? (
                item.statusHistory.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                  >
                    <p className="font-semibold text-slate-950">
                      {entry.action}
                    </p>
                    <p className="mt-1 text-slate-700">{entry.summary}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {entry.actor} · {entry.occurredAt}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  No item audit history was returned by the internal API.
                </p>
              )}
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
        <ItemStatusActionsClient
          itemId={item.id}
          status={item.status}
          activeFormAssociationCount={item.activeFormAssociationCount}
        />
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Metadata</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Item ID</dt>
                <dd className="max-w-[220px] text-right font-semibold">
                  {item.id}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Domain</dt>
                <dd className="font-semibold">
                  {itemDomainLabels[item.domain] ?? item.domain}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Type</dt>
                <dd className="font-semibold">{item.itemType}</dd>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-semibold">
                  {itemStatusLabels[item.status] ?? item.status}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Version</dt>
                <dd className="font-semibold">{item.version}</dd>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Difficulty</dt>
                <dd className="font-semibold">
                  {item.difficulty ?? 'Not set'}
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
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Form associations</h2>

            <div className="mt-5 space-y-3">
              {item.formAssociations.length > 0 ? (
                item.formAssociations.map((association) => (
                  <article
                    key={association.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                  >
                    <p className="font-semibold text-slate-950">
                      {association.formId}
                    </p>
                    <p className="mt-1 text-slate-600">
                      Section {association.sectionId ?? 'not linked'} · position{' '}
                      {association.orderIndex ?? 'not set'}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {association.status}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  This item has no form association.
                </p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
