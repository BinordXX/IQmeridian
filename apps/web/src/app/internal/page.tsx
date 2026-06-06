import { InternalWorkspaceCard } from '@/features/internal/components/internal-workspace-card';

export default function InternalOverviewPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Internal workspace
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Separate operational control from research review
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          Internal tooling is intentionally separated from candidate, employer,
          and consumer experiences. Platform administration focuses on
          operational oversight, while researcher tooling focuses on structured
          assessment data, responses, scoring, and evidence quality.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <InternalWorkspaceCard
          title="Platform admin"
          body="Operational oversight for campaigns, sessions, reports, audit logs, organisations, and platform-level control."
          href="/internal/admin"
          actionLabel="Open admin workspace"
        />

        <InternalWorkspaceCard
          title="Researcher"
          body="Research-oriented review of assessment sessions, responses, scoring outputs, and item-level evidence quality."
          href="/internal/researcher"
          actionLabel="Open researcher workspace"
        />
      </section>
    </div>
  );
}
