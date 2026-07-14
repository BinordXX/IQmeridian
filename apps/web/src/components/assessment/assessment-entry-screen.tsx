import Link from 'next/link';

type AssessmentEntryScreenProps = {
  mode: 'invitation' | 'consumer';
  invitationToken?: string;
};

export function AssessmentEntryScreen({
  mode,
  invitationToken,
}: AssessmentEntryScreenProps) {
  const isInvitation = mode === 'invitation';

  const instructionsHref = isInvitation
    ? `/assessment/invitation/${invitationToken}/instructions`
    : '/assessment/instructions';

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-5xl items-start justify-center">
        <section className="relative w-full overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:rounded-[2rem] sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.12),transparent_30%)]" />

          <div className="relative">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Assessment entry
              </p>

              <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
                You are about to begin the IQMeridian assessment
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                This assessment is designed to capture structured cognitive
                performance across the currently assigned reasoning domains.
                Before the timed session begins, you will review the assessment
                instructions and confirm that you are ready.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-cyan-300/10 bg-[#020817]/75 p-5">
                <p className="text-sm font-black text-white">Format</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Abstract and numerical reasoning items, presented through the
                  assigned assessment form.
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-300/10 bg-[#020817]/75 p-5">
                <p className="text-sm font-black text-white">Timing</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Section timing begins only after the readiness confirmation
                  step.
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-300/10 bg-[#020817]/75 p-5">
                <p className="text-sm font-black text-white">Submission</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Submit only when ready. Closed sessions cannot accept further
                  response changes.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-[#020817]/75 p-5">
              <p className="text-sm font-black text-white">Access context</p>

              <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Access type</dt>
                  <dd className="mt-1 font-black text-cyan-100">
                    {isInvitation
                      ? 'Employer invitation'
                      : 'Consumer assessment'}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-500">Current status</dt>
                  <dd className="mt-1 font-black text-cyan-100">
                    Awaiting instruction review
                  </dd>
                </div>

                {isInvitation ? (
                  <div className="md:col-span-2">
                    <dt className="text-slate-500">Invitation token</dt>
                    <dd className="mt-1 break-all font-mono text-xs font-black text-slate-200">
                      {invitationToken}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs leading-5 text-slate-500">
                Continue to the instruction screen before confirming readiness.
                The timed session will not start on this page.
              </p>

              <Link
                href={instructionsHref}
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
              >
                View instructions
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
