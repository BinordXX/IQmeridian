import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  fetchInternalItemTraceability,
  formatJsonValue,
} from '../../../../_lib/internal-api';

export default async function InternalItemTraceabilityPage({
  params,
}: {
  params: Promise<{
    itemId: string;
  }>;
}) {
  const { itemId } = await params;

  const traceability = await fetchInternalItemTraceability(
    decodeURIComponent(itemId)
  )
    .then((record) => record)
    .catch(() => null);

  if (!traceability) {
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
          href={`/internal/researcher/item-bank/${encodeURIComponent(
            traceability.itemId
          )}`}
          className="font-bold text-slate-500 underline-offset-4 hover:text-cyan-200 hover:underline"
        >
          {traceability.itemId}
        </Link>

        <span className="text-slate-600">/</span>

        <span className="font-black text-slate-300">Traceability</span>
      </nav>

      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Item-to-form traceability
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            {traceability.itemLabel}
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This view shows where the item has appeared, how much exposure it
            has accumulated, and which sessions are associated with it. This
            supports later interpretation of performance patterns and retirement
            decisions.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-sm font-bold text-slate-500">Exposure</p>
          <p className="mt-3 text-3xl font-black text-white">
            {traceability.totalExposureCount}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-sm font-bold text-slate-500">Valid responses</p>
          <p className="mt-3 text-3xl font-black text-white">
            {traceability.totalValidResponses}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-sm font-bold text-slate-500">Correct responses</p>
          <p className="mt-3 text-3xl font-black text-white">
            {traceability.totalCorrectResponses}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-sm font-bold text-slate-500">Omissions</p>
          <p className="mt-3 text-3xl font-black text-white">
            {traceability.totalOmissions}
          </p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <h2 className="text-lg font-black text-white">Form appearances</h2>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#020817]/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Form</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Mapping status</th>
                <th className="px-4 py-3">Exposure</th>
                <th className="px-4 py-3">Valid responses</th>
                <th className="px-4 py-3">Correct responses</th>
                <th className="px-4 py-3">Omissions</th>
                <th className="px-4 py-3">Completed sessions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10 bg-[#020817]/45">
              {traceability.forms.map((form) => (
                <tr
                  key={form.mappingId}
                  className="transition hover:bg-cyan-400/[0.04]"
                >
                  <td className="px-4 py-4">
                    <p className="font-black text-white">{form.formId}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {form.formLabel}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {form.sectionId ?? 'Not linked'}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {form.orderIndex ?? 'Not set'}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {form.mappingStatus}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {form.exposureCount}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {form.validResponses}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {form.correctResponses}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {form.omissionCount}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {form.completedSessions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {traceability.forms.length === 0 ? (
            <div className="border-t border-white/10 bg-[#020817]/70 px-4 py-8 text-center text-sm text-slate-500">
              This item has not appeared in any form yet.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <h2 className="text-lg font-black text-white">Linked sessions</h2>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[#020817]/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">Form</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Answered</th>
                <th className="px-4 py-3">Answer</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Band</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10 bg-[#020817]/45">
              {traceability.linkedSessions.map((session) => (
                <tr
                  key={session.sessionId}
                  className="transition hover:bg-cyan-400/[0.04]"
                >
                  <td className="px-4 py-4">
                    <Link
                      href={`/internal/admin/sessions/${encodeURIComponent(
                        session.sessionId
                      )}`}
                      className="font-black text-cyan-100 underline-offset-4 hover:underline"
                    >
                      {session.sessionId}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {session.participantIdentifier}
                  </td>
                  <td className="px-4 py-4 text-slate-300">{session.formId}</td>
                  <td className="px-4 py-4 text-slate-300">
                    {session.sessionStatus}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {session.answeredItem ? 'Yes' : 'No'}
                  </td>
                  <td className="px-4 py-4">
                    <pre className="max-w-[220px] overflow-auto rounded-xl border border-white/10 bg-[#020817] p-2 text-xs leading-5 text-cyan-50">
                      {formatJsonValue(session.answer)}
                    </pre>
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {session.submittedAt ?? 'Not submitted'}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {session.overallBand ?? 'Not scored'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {traceability.linkedSessions.length === 0 ? (
            <div className="border-t border-white/10 bg-[#020817]/70 px-4 py-8 text-center text-sm text-slate-500">
              No sessions are associated with this item yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
