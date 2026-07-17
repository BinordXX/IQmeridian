import { redirect } from 'next/navigation';

import { ReadinessConfirmation } from '@/features/assessment/components/readiness-confirmation';
import { guardSessionInstructionsRoute } from '@/features/assessment/guards/assessment-route-guards';

type SessionInstructionsPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SessionInstructionsPage({
  params,
}: SessionInstructionsPageProps) {
  const { sessionId } = await params;
  const guard = await guardSessionInstructionsRoute(sessionId);

  if (!guard.allowed) {
    redirect(guard.redirectTo);
  }

  const session = guard.data;

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 sm:py-12">
      <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:rounded-[2rem] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.12),transparent_30%)]" />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            IQMeridian assessment
          </p>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
            {session.assessmentTitle}
          </h1>

          {session.candidateName ? (
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Candidate:{' '}
              <span className="font-black text-cyan-100">
                {session.candidateName}
              </span>
            </p>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-cyan-300/10 bg-[#020817]/75 p-5">
              <h2 className="text-sm font-black text-white">Environment</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Use a stable internet connection and avoid refreshing the
                browser while the timed assessment is active.
              </p>
            </article>

            <article className="rounded-2xl border border-cyan-300/10 bg-[#020817]/75 p-5">
              <h2 className="text-sm font-black text-white">Timing</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Timed sections begin only after you confirm readiness. Section
                movement is controlled by the system.
              </p>
            </article>

            <article className="rounded-2xl border border-cyan-300/10 bg-[#020817]/75 p-5">
              <h2 className="text-sm font-black text-white">Submission</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Submit only when ready. Once the session is finalised, responses
                cannot be changed.
              </p>
            </article>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#020817]/75 p-5">
            <h2 className="text-sm font-black text-white">Before you begin</h2>

            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
              <p>
                Read the instructions carefully before beginning. Once you
                confirm readiness, the timed assessment session will begin.
              </p>

              <p>
                Complete the assessment independently and without external
                assistance. The system will save responses and control the
                active assessment state.
              </p>

              <p>
                If your connection drops, return through the valid assessment
                route so the platform can recover the latest backend session
                state.
              </p>
            </div>
          </div>

          <ReadinessConfirmation
            sessionId={session.sessionId}
            mode="start"
            buttonLabel="I confirm I am ready to begin"
          />
        </div>
      </section>
    </main>
  );
}
