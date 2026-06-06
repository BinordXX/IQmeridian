import { redirect } from 'next/navigation';

import { guardPlatformAdminRoute } from '@/features/internal/guards/internal-route-guards';

const MetricCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
};

export default async function InternalAdminPage() {
  const guard = await guardPlatformAdminRoute();

  if (!guard.allowed) {
    redirect('/internal/unavailable');
  }

  const { data } = guard;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Platform admin
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Operational oversight
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          This workspace is for platform-level monitoring of sessions, reports,
          and audit events. It is not part of the employer-facing commercial
          workflow.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Audit logs"
          value={data.metrics.auditLogCount}
          helper="Recent platform events loaded"
        />

        <MetricCard
          label="Sessions"
          value={data.metrics.sessionCount}
          helper="Assessment sessions visible to admin"
        />

        <MetricCard
          label="Completed sessions"
          value={data.metrics.completedSessionCount}
          helper="Submitted assessment sessions"
        />

        <MetricCard
          label="Reports"
          value={data.metrics.reportCount}
          helper="Generated report records"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-950">
            Recent audit activity
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Platform-visible audit events from backend services.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.auditLogs.length > 0 ? (
                data.auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="px-4 py-4 text-sm font-medium text-slate-950">
                      {log.action}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {log.entityType} · {log.entityId}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {log.userId}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : 'Not shown'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No audit events are available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
