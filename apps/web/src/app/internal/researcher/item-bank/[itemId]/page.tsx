import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ItemReviewReadinessClient } from '../../../_components/item-review-readiness-client';
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
        <Link
          href="/internal"
          className="font-bold text-slate-500 underline-offset-4 hover:text-cyan-200 hover:underline"
        >
          Internal dashboard
        </Link>

        <span className="text-slate-600">/</span>

        <Link
          href="/internal/researcher/item-bank"
          className="font-bold text-slate-500 underline-offset-4 hover:text-cyan-200 hover:underline"
        >
          Item bank
        </Link>

        <span className="text-slate-600">/</span>

        <span className="break-all font-black text-slate-300">{item.id}</span>
      </nav>

      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Item detail
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              {item.label}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              This detail view reads item content, form associations,
              performance indicators, review readiness, and audit-derived
              history from the internal API.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/internal/researcher/item-bank/${encodeURIComponent(
                item.id
              )}/performance`}
              className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
            >
              View performance
            </Link>

            <Link
              href={`/internal/researcher/item-bank/${encodeURIComponent(
                item.id
              )}/traceability`}
              className="rounded-full border border-white/10 bg-[#020817]/70 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
            >
              View traceability
            </Link>

            {item.status === 'DRAFT' ? (
              <Link
                href={`/internal/researcher/item-bank/${encodeURIComponent(
                  item.id
                )}/edit`}
                className="rounded-full border border-white/10 bg-[#020817]/70 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
              >
                Edit draft
              </Link>
            ) : null}

            <Link
              href={`/internal/researcher/item-bank/${encodeURIComponent(
                item.id
              )}/attach-form`}
              className="rounded-full border border-white/10 bg-[#020817]/70 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
            >
              Attach to form
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Full item content</h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-bold text-slate-500">Prompt</p>
                <p className="mt-2 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm leading-7 text-slate-300">
                  {item.prompt}
                </p>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-500">Options</p>
                <pre className="mt-2 overflow-auto rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm leading-7 text-cyan-50">
                  {formatJsonValue(item.options)}
                </pre>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-500">
                  Correct answer
                </p>
                <pre className="mt-2 overflow-auto rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-black leading-7 text-emerald-100">
                  {formatJsonValue(item.correctAnswer)}
                </pre>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Status history</h2>

            <div className="mt-5 space-y-3">
              {item.statusHistory.length > 0 ? (
                item.statusHistory.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm"
                  >
                    <p className="font-black text-white">{entry.action}</p>
                    <p className="mt-1 leading-7 text-slate-400">
                      {entry.summary}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {entry.actor} · {entry.occurredAt}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-500">
                  No item audit history was returned by the internal API.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Review notes</h2>

            <div className="mt-5 space-y-3">
              {item.reviewNotes.length > 0 ? (
                item.reviewNotes.map((note) => (
                  <p
                    key={note}
                    className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm leading-7 text-slate-400"
                  >
                    {note}
                  </p>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-500">
                  No review notes were returned by the internal API.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Primary controls
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Review/readiness controls are separate from operational item
              status. Use both deliberately before attaching items to serious
              pilot or production forms.
            </p>
          </section>

          <ItemReviewReadinessClient item={item} />

          <ItemStatusActionsClient
            itemId={item.id}
            status={item.status}
            activeFormAssociationCount={item.activeFormAssociationCount}
          />

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Metadata</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Item ID</dt>
                <dd className="max-w-[220px] break-all text-right font-black text-white">
                  {item.id}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Domain</dt>
                <dd className="text-right font-black text-white">
                  {itemDomainLabels[item.domain] ?? item.domain}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Type</dt>
                <dd className="text-right font-black text-white">
                  {item.itemType}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Operational status</dt>
                <dd className="text-right font-black text-white">
                  {itemStatusLabels[item.status] ?? item.status}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Version</dt>
                <dd className="text-right font-black text-white">
                  {item.version}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Difficulty</dt>
                <dd className="text-right font-black text-white">
                  {item.difficulty ?? 'Not set'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">
              Performance indicators
            </h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Exposure</dt>
                <dd className="font-black text-white">
                  {item.performance.exposureCount}
                </dd>
              </div>

              <div className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Valid responses</dt>
                <dd className="font-black text-white">
                  {item.performance.validResponses}
                </dd>
              </div>

              <div className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Correct rate</dt>
                <dd className="font-black text-white">
                  {formatCorrectRate(item.performance.correctResponseRate)}
                </dd>
              </div>

              <div className="flex justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Omissions</dt>
                <dd className="font-black text-white">
                  {item.performance.omissionCount}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Form associations</h2>

            <div className="mt-5 space-y-3">
              {item.formAssociations.length > 0 ? (
                item.formAssociations.map((association) => (
                  <article
                    key={association.id}
                    className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm"
                  >
                    <p className="font-black text-white">
                      {association.formId}
                    </p>

                    <p className="mt-1 leading-7 text-slate-400">
                      Section {association.sectionId ?? 'not linked'} · position{' '}
                      {association.orderIndex ?? 'not set'}
                    </p>

                    <p className="mt-2 text-xs font-bold text-slate-500">
                      {association.status}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-500">
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
