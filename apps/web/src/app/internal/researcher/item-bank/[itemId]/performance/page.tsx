import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  fetchInternalItemById,
  fetchInternalItemPerformance,
  formatCorrectRate,
  itemDomainLabels,
  itemStatusLabels,
} from '../../../../_lib/internal-api';

export default async function InternalItemPerformancePage({
  params,
}: {
  params: Promise<{
    itemId: string;
  }>;
}) {
  const { itemId } = await params;
  const decodedItemId = decodeURIComponent(itemId);

  const [item, performance] = await Promise.all([
    fetchInternalItemById(decodedItemId).catch(() => null),
    fetchInternalItemPerformance(decodedItemId).catch(() => null),
  ]);

  if (!item || !performance) {
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
        <Link
          href={`/internal/researcher/item-bank/${encodeURIComponent(item.id)}`}
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
          This view now reads item-performance indicators from the internal API.
          Values are derived from form mappings, sessions, and response records.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Exposure count</p>
          <p className="mt-3 text-3xl font-semibold">
            {performance.exposureCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Valid responses</p>
          <p className="mt-3 text-3xl font-semibold">
            {performance.validResponses}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Correct-response rate
          </p>
          <p className="mt-3 text-3xl font-semibold">
            {formatCorrectRate(performance.correctResponseRate)}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Omissions</p>
          <p className="mt-3 text-3xl font-semibold">
            {performance.omissionCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Average response time
          </p>
          <p className="mt-3 text-3xl font-semibold">
            {performance.averageResponseTimeSeconds === null
              ? '—'
              : `${performance.averageResponseTimeSeconds}s`}
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Operational interpretation</h2>

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
                  <td className="px-4 py-4">{performance.exposureCount}</td>
                  <td className="px-4 py-4 text-slate-700">
                    Low exposure limits interpretability; high exposure may
                    increase content familiarity risk.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium">Correct rate</td>
                  <td className="px-4 py-4">
                    {formatCorrectRate(performance.correctResponseRate)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    Very low or high values may reflect calibration, ambiguity,
                    overexposure, or form-placement effects.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium">Omissions</td>
                  <td className="px-4 py-4">{performance.omissionCount}</td>
                  <td className="px-4 py-4 text-slate-700">
                    Omission counts should be interpreted against form length
                    and completion state.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium">Average time</td>
                  <td className="px-4 py-4">
                    {performance.averageResponseTimeSeconds === null
                      ? 'No data'
                      : `${performance.averageResponseTimeSeconds}s`}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    Longer response times may indicate cognitive load,
                    ambiguity, or interface friction.
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
                <dd className="max-w-[220px] text-right font-semibold">
                  {item.id}
                </dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Domain</dt>
                <dd className="font-semibold">
                  {itemDomainLabels[item.domain] ?? item.domain}
                </dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-semibold">
                  {itemStatusLabels[item.status] ?? item.status}
                </dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Difficulty</dt>
                <dd className="font-semibold">
                  {item.difficulty ?? 'Not set'}
                </dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Active form associations</dt>
                <dd className="font-semibold">
                  {performance.activeFormAssociations}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>
    </div>
  );
}
