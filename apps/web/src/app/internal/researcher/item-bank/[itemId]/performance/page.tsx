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

        <Link
          href={`/internal/researcher/item-bank/${encodeURIComponent(item.id)}`}
          className="font-bold text-slate-500 underline-offset-4 hover:text-cyan-200 hover:underline"
        >
          {item.id}
        </Link>

        <span className="text-slate-600">/</span>

        <span className="font-black text-slate-300">Performance</span>
      </nav>

      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Item performance
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            {item.label}
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This view reads item-performance indicators from the internal API.
            Values are derived from form mappings, sessions, and response
            records.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-sm font-bold text-slate-500">Exposure count</p>
          <p className="mt-3 text-3xl font-black text-white">
            {performance.exposureCount}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-sm font-bold text-slate-500">Valid responses</p>
          <p className="mt-3 text-3xl font-black text-white">
            {performance.validResponses}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-sm font-bold text-slate-500">
            Correct-response rate
          </p>
          <p className="mt-3 text-3xl font-black text-white">
            {formatCorrectRate(performance.correctResponseRate)}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-sm font-bold text-slate-500">Omissions</p>
          <p className="mt-3 text-3xl font-black text-white">
            {performance.omissionCount}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-sm font-bold text-slate-500">
            Average response time
          </p>
          <p className="mt-3 text-3xl font-black text-white">
            {performance.averageResponseTimeSeconds === null
              ? '—'
              : `${performance.averageResponseTimeSeconds}s`}
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <h2 className="text-lg font-black text-white">
            Operational interpretation
          </h2>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#020817]/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Indicator</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Interpretive caution</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 bg-[#020817]/45">
                <tr className="transition hover:bg-cyan-400/[0.04]">
                  <td className="px-4 py-4 font-black text-white">Exposure</td>
                  <td className="px-4 py-4 text-slate-300">
                    {performance.exposureCount}
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    Low exposure limits interpretability; high exposure may
                    increase content familiarity risk.
                  </td>
                </tr>

                <tr className="transition hover:bg-cyan-400/[0.04]">
                  <td className="px-4 py-4 font-black text-white">
                    Correct rate
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {formatCorrectRate(performance.correctResponseRate)}
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    Very low or high values may reflect calibration, ambiguity,
                    overexposure, or form-placement effects.
                  </td>
                </tr>

                <tr className="transition hover:bg-cyan-400/[0.04]">
                  <td className="px-4 py-4 font-black text-white">Omissions</td>
                  <td className="px-4 py-4 text-slate-300">
                    {performance.omissionCount}
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    Omission counts should be interpreted against form length
                    and completion state.
                  </td>
                </tr>

                <tr className="transition hover:bg-cyan-400/[0.04]">
                  <td className="px-4 py-4 font-black text-white">
                    Average time
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {performance.averageResponseTimeSeconds === null
                      ? 'No data'
                      : `${performance.averageResponseTimeSeconds}s`}
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    Longer response times may indicate cognitive load,
                    ambiguity, or interface friction.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-black text-white">Item context</h2>

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
                <dt className="text-slate-500">Status</dt>
                <dd className="text-right font-black text-white">
                  {itemStatusLabels[item.status] ?? item.status}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Difficulty</dt>
                <dd className="text-right font-black text-white">
                  {item.difficulty ?? 'Not set'}
                </dd>
              </div>

              <div className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                <dt className="text-slate-500">Active form associations</dt>
                <dd className="text-right font-black text-white">
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
