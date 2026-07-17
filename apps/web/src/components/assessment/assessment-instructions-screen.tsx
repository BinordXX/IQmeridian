import Link from 'next/link';

type AssessmentInstructionsScreenProps = {
  mode: 'consumer' | 'invitation' | 'session';
  invitationToken?: string;
  sessionId?: string;
  nextHref?: string;
  continueAction?: () => Promise<void>;
  continueLabel?: string;
};

const instructionBlocks = [
  {
    title: 'Assessment structure',
    body: 'The assessment is organised into reasoning sections. Each section is completed under its own timing rules.',
  },
  {
    title: 'Section timing',
    body: 'Timing is controlled by the platform. Once a timed section begins, the remaining time is calculated from backend session state rather than from the browser alone.',
  },
  {
    title: 'Skipping and returning',
    body: 'Navigation rules are enforced by the assessment interface. If returning to previous items is allowed, the controls will make this clear. If it is restricted, unavailable actions remain disabled.',
  },
  {
    title: 'Answer saving',
    body: 'Selected answers are saved during the assessment. The interface shows a save-state indicator so you can see whether the latest answer has been captured.',
  },
  {
    title: 'When time expires',
    body: 'When the valid time for a section expires, that section should no longer remain interactable. The platform will move the assessment forward according to the active session rules.',
  },
  {
    title: 'Final submission',
    body: 'Submission is final. Once the assessment is submitted and the session is closed, responses cannot be changed.',
  },
];

export function AssessmentInstructionsScreen({
  mode,
  invitationToken,
  sessionId,
  nextHref,
  continueAction,
  continueLabel = 'Continue',
}: AssessmentInstructionsScreenProps) {
  const accessLabel =
    mode === 'invitation'
      ? 'Employer invitation'
      : mode === 'session'
        ? 'Existing session'
        : 'Consumer assessment';

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 sm:py-12">
      <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:rounded-[2rem] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.12),transparent_30%)]" />

        <div className="relative">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Assessment instructions
            </p>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
              Read this before you begin
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              These instructions define how the assessment session will behave.
              Read them carefully before confirming that you are ready to start.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {instructionBlocks.map((block) => (
              <article
                key={block.title}
                className="rounded-2xl border border-cyan-300/10 bg-[#020817]/75 p-5"
              >
                <h3 className="text-sm font-black text-white">{block.title}</h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {block.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#020817]/75 p-5">
            <h3 className="text-sm font-black text-white">
              Current access context
            </h3>

            <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="text-slate-500">Access type</dt>
                <dd className="mt-1 font-black text-cyan-100">{accessLabel}</dd>
              </div>

              <div>
                <dt className="text-slate-500">Readiness status</dt>
                <dd className="mt-1 font-black text-cyan-100">
                  Instructions not yet confirmed
                </dd>
              </div>

              {invitationToken ? (
                <div className="md:col-span-2">
                  <dt className="text-slate-500">Invitation token</dt>
                  <dd className="mt-1 break-all font-mono text-xs font-black text-slate-200">
                    {invitationToken}
                  </dd>
                </div>
              ) : null}

              {sessionId ? (
                <div className="md:col-span-2">
                  <dt className="text-slate-500">Session ID</dt>
                  <dd className="mt-1 break-all font-mono text-xs font-black text-slate-200">
                    {sessionId}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-5 text-slate-500">
              The next step will ask you to explicitly confirm readiness before
              the timed session begins. Do not continue unless you are prepared
              to start under the assessment timing rules.
            </p>

            {continueAction ? (
              <form action={continueAction}>
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 sm:w-auto"
                >
                  {continueLabel}
                </button>
              </form>
            ) : nextHref ? (
              <Link
                href={nextHref}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
              >
                {continueLabel}
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-400 opacity-70"
              >
                {continueLabel}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
