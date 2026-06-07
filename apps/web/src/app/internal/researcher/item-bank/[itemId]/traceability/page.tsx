import Link from "next/link";
import { notFound } from "next/navigation";

import {
  fetchInternalItemTraceability,
  formatJsonValue,
} from "../../../../_lib/internal-api";

export default async function InternalItemTraceabilityPage({
  params,
}: {
  params: Promise<{
    itemId: string;
  }>;
}) {
  const { itemId } = await params;

  const traceability = await fetchInternalItemTraceability(
    decodeURIComponent(itemId),
  )
    .then((record) => record)
    .catch(() => null);

  if (!traceability) {
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
          href={`/internal/researcher/item-bank/${encodeURIComponent(
            traceability.itemId,
          )}`}
          className="font-medium text-slate-600"
        >
          {traceability.itemId}
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-950">Traceability</span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Item-to-form traceability
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {traceability.itemLabel}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This view shows where the item has appeared, how much exposure it has
          accumulated, and which sessions are associated with it. This supports
          later interpretation of performance patterns and retirement decisions.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Exposure</p>
          <p className="mt-3 text-3xl font-semibold">
            {traceability.totalExposureCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Valid responses</p>
          <p className="mt-3 text-3xl font-semibold">
            {traceability.totalValidResponses}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Correct responses
          </p>
          <p className="mt-3 text-3xl font-semibold">
            {traceability.totalCorrectResponses}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Omissions</p>
          <p className="mt-3 text-3xl font-semibold">
            {traceability.totalOmissions}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Form appearances</h2>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
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

            <tbody className="divide-y divide-slate-200 bg-white">
              {traceability.forms.map((form) => (
                <tr key={form.mappingId}>
                  <td className="px-4 py-4">
                    <p className="font-semibold">{form.formId}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {form.formLabel}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {form.sectionId ?? "Not linked"}
                  </td>
                  <td className="px-4 py-4">
                    {form.orderIndex ?? "Not set"}
                  </td>
                  <td className="px-4 py-4">{form.mappingStatus}</td>
                  <td className="px-4 py-4">{form.exposureCount}</td>
                  <td className="px-4 py-4">{form.validResponses}</td>
                  <td className="px-4 py-4">{form.correctResponses}</td>
                  <td className="px-4 py-4">{form.omissionCount}</td>
                  <td className="px-4 py-4">{form.completedSessions}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {traceability.forms.length === 0 ? (
            <div className="bg-white px-4 py-8 text-center text-sm text-slate-600">
              This item has not appeared in any form yet.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Linked sessions</h2>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
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

            <tbody className="divide-y divide-slate-200 bg-white">
              {traceability.linkedSessions.map((session) => (
                <tr key={session.sessionId}>
                  <td className="px-4 py-4">
                    <Link
                      href={`/internal/admin/sessions/${encodeURIComponent(
                        session.sessionId,
                      )}`}
                      className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                    >
                      {session.sessionId}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    {session.participantIdentifier}
                  </td>
                  <td className="px-4 py-4">{session.formId}</td>
                  <td className="px-4 py-4">{session.sessionStatus}</td>
                  <td className="px-4 py-4">
                    {session.answeredItem ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-4">
                    <pre className="max-w-[220px] overflow-auto rounded-lg bg-slate-50 p-2 text-xs">
                      {formatJsonValue(session.answer)}
                    </pre>
                  </td>
                  <td className="px-4 py-4">
                    {session.submittedAt ?? "Not submitted"}
                  </td>
                  <td className="px-4 py-4">
                    {session.overallBand ?? "Not scored"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {traceability.linkedSessions.length === 0 ? (
            <div className="bg-white px-4 py-8 text-center text-sm text-slate-600">
              No sessions are associated with this item yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}