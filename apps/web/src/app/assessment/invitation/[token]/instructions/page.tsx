import { redirect } from 'next/navigation';

import { ReadinessConfirmation } from '@/features/assessment/components/readiness-confirmation';
import { guardInvitationInstructionsRoute } from '@/features/assessment/guards/assessment-route-guards';

type InvitationInstructionsPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitationInstructionsPage({
  params,
}: InvitationInstructionsPageProps) {
  const { token } = await params;
  const guard = await guardInvitationInstructionsRoute(token);

  if (!guard.allowed) {
    redirect(guard.redirectTo);
  }

  const invitation = guard.data;

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 sm:py-12">
      <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:rounded-[2rem] sm:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]" />

        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
          IQMeridian assessment
        </p>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
          {invitation.assessmentTitle ?? 'Candidate assessment'}
        </h1>

        {invitation.candidateName ? (
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Candidate:{' '}
            <span className="font-black text-cyan-100">
              {invitation.candidateName}
            </span>
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-cyan-300/10 bg-[#020817]/70 p-5">
            <h2 className="text-sm font-black text-white">Format</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Complete the assigned cognitive reasoning sections for this
              campaign.
            </p>
          </article>

          <article className="rounded-2xl border border-cyan-300/10 bg-[#020817]/70 p-5">
            <h2 className="text-sm font-black text-white">Timing</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Timed sections begin only after you confirm readiness.
            </p>
          </article>

          <article className="rounded-2xl border border-cyan-300/10 bg-[#020817]/70 p-5">
            <h2 className="text-sm font-black text-white">Submission</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Submit only when ready. Closed sessions cannot accept further
              changes.
            </p>
          </article>
        </div>

        <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-sm leading-7 text-slate-300">
          <p>
            Read the instructions carefully before beginning. Once you confirm
            readiness, the timed assessment session will begin.
          </p>

          <p>
            Use a stable internet connection, avoid refreshing the browser, and
            complete the assessment without external assistance.
          </p>
        </div>

        {invitation.sections && invitation.sections.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-black text-white">
              Assessment sections
            </h2>

            <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[#020817]/70">
              {invitation.sections.map((section) => (
                <div key={section.sectionId} className="p-5">
                  <p className="font-black text-white">{section.title}</p>
                  <p className="mt-1 text-sm text-cyan-100/80">
                    {section.itemCount} items
                    {section.timeLimitSeconds
                      ? ` · ${Math.round(section.timeLimitSeconds / 60)} minutes`
                      : ''}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {section.instructions}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <ReadinessConfirmation invitationToken={token} />
      </section>
    </main>
  );
}
