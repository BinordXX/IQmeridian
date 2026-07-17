import Link from 'next/link';
import { EmployerParticipantsTable } from '@/features/employer/components/employer-participants-table';
import { listEmployerParticipants } from '@/features/employer/api/employer-participants-api';

export default async function EmployerParticipantsPage() {
  let participants: Awaited<ReturnType<typeof listEmployerParticipants>> = [];
  let errorMessage: string | null = null;

  try {
    participants = await listEmployerParticipants();
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : 'Unable to load organisation participants.';
  }

  return (
    <main className="min-h-screen bg-[#020817] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
          />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                Employer workspace
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
                Organisation participants
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                Review the candidates and managed participants linked to your
                organisation. This register is the foundation for reassessment
                cycles, participant archiving, and organisation-level candidate
                history.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/[0.07]"
                href="/employer"
              >
                Employer dashboard
              </Link>

              <Link
                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
                href="/employer/campaigns"
              >
                Campaigns
              </Link>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-[2rem] border border-red-300/20 bg-red-400/10 p-5 text-sm font-bold leading-6 text-red-100">
            {errorMessage}
          </section>
        ) : (
          <EmployerParticipantsTable participants={participants} />
        )}
      </div>
    </main>
  );
}
