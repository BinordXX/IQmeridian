import Link from 'next/link';

import { fetchMyResearcherAssignments } from './_lib/researcher-authoring-api';

export const dynamic = 'force-dynamic';

const getStatusClassName = (status: string) => {
  if (status === 'ACTIVE') {
    return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
  }

  if (status === 'PAUSED') {
    return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
  }

  if (status === 'COMPLETED') {
    return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
  }

  return 'border-red-300/20 bg-red-400/10 text-red-100';
};

export default async function ResearcherAssignmentsPage() {
  let assignments = await fetchMyResearcherAssignments();

  assignments = assignments.sort(
    (leftAssignment, rightAssignment) =>
      new Date(rightAssignment.assignedAt).getTime() -
      new Date(leftAssignment.assignedAt).getTime()
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.18),transparent_32%)]"
        />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Researcher workspace
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            My section assignments
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Create and submit assessment items only inside sections assigned to
            you by a platform administrator.
          </p>
        </div>
      </section>

      <section className="grid gap-5">
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <Link
              className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition hover:border-cyan-300/25 hover:bg-[#0b1c3f]"
              href={`/internal/researcher/assignments/${assignment.id}`}
              key={assignment.id}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${getStatusClassName(
                      assignment.status
                    )}`}
                  >
                    {assignment.status}
                  </span>

                  <h2 className="mt-4 text-xl font-black text-white">
                    {assignment.section.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {assignment.form.name} · {assignment.section.domain}
                  </p>

                  {assignment.notes ? (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                      {assignment.notes}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Target
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {assignment.targetItemCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Created
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {assignment._count?.items ?? 0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Due
                    </p>
                    <p className="mt-2 text-sm font-black text-white">
                      {assignment.dueAt
                        ? new Date(assignment.dueAt).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-10 text-center">
            <p className="text-sm font-bold text-slate-400">
              No active section assignments are currently assigned to you.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}
