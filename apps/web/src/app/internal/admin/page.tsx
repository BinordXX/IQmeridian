import Link from 'next/link';

import {
  fetchAnalyticsExportDefinitions,
  fetchInternalAuditEvents,
  fetchInternalSessions,
} from '../_lib/internal-api';

export default async function InternalAdminDashboardPage() {
  const [sessions, auditEvents, exportDefinitions] = await Promise.all([
    fetchInternalSessions(),
    fetchInternalAuditEvents(),
    fetchAnalyticsExportDefinitions(),
  ]);

  const completedSessions = sessions.filter(
    (session) => session.status === 'COMPLETED'
  ).length;
  const inProgressSessions = sessions.filter(
    (session) => session.status === 'IN_PROGRESS'
  ).length;
  const flaggedSessions = sessions.filter(
    (session) => session.suspiciousFlagStatus !== 'NONE'
  ).length;

  const exportEvents = auditEvents.filter((event) =>
    event.action.includes('EXPORT')
  );

  const itemLifecycleEvents = auditEvents.filter(
    (event) =>
      event.action.includes('ITEM_ACTIVATED') ||
      event.action.includes('ITEM_RETIRED')
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Platform administration
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Operational oversight dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This dashboard now uses the internal API for session, audit, and
            export-definition data. Some governance metrics still need dedicated
            organisation, campaign, user-role, and platform-error endpoints.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/internal/admin/sessions"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Review sessions
          </Link>
          <Link
            href="/internal/admin/exports"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Manage exports
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total sessions</p>
          <p className="mt-3 text-3xl font-semibold">{sessions.length}</p>
          <p className="mt-2 text-sm text-slate-600">
            Sessions returned by the internal API.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Completed sessions
          </p>
          <p className="mt-3 text-3xl font-semibold">{completedSessions}</p>
          <p className="mt-2 text-sm text-slate-600">
            Sessions currently marked completed.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            In-progress sessions
          </p>
          <p className="mt-3 text-3xl font-semibold">{inProgressSessions}</p>
          <p className="mt-2 text-sm text-slate-600">
            Sessions still open or partially completed.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Flagged sessions</p>
          <p className="mt-3 text-3xl font-semibold">{flaggedSessions}</p>
          <p className="mt-2 text-sm text-slate-600">
            Sessions currently carrying suspicious markers.
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recent audit activity</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Internal audit activity is now read from the database-backed audit
            endpoint.
          </p>

          <div className="mt-5 space-y-3">
            {auditEvents.slice(0, 8).map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {event.action}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {event.entityType ?? 'Unknown entity'} ·{' '}
                      {event.entityId ?? 'No entity ID'}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold">
                    {event.actor}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-500">{event.createdAt}</p>
              </article>
            ))}

            {auditEvents.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No audit events were returned by the internal API.
              </p>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Export definitions</h2>

            <div className="mt-5 space-y-3">
              {exportDefinitions.map((definition) => (
                <article
                  key={definition.dataset}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                >
                  <p className="font-semibold">{definition.label}</p>
                  <p className="mt-2 text-slate-600">
                    {definition.format} ·{' '}
                    {definition.currentlyAvailable
                      ? 'Available'
                      : 'Pending backend wiring'}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Export events</h2>

            <div className="mt-5 space-y-3">
              {exportEvents.length > 0 ? (
                exportEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                  >
                    <p className="font-semibold">{event.action}</p>
                    <p className="mt-2 text-slate-600">{event.createdAt}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  No export audit events are currently recorded.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Item activations and retirements
            </h2>

            <div className="mt-5 space-y-3">
              {itemLifecycleEvents.length > 0 ? (
                itemLifecycleEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                  >
                    <p className="font-semibold">{event.action}</p>
                    <p className="mt-2 text-slate-600">
                      {event.entityId ?? 'No entity ID'}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  No item activation or retirement audit events are currently
                  recorded.
                </p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
