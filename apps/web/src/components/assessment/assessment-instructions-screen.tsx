import Link from 'next/link';

type AssessmentInstructionsScreenProps = {
  mode: 'consumer' | 'invitation' | 'session';
  invitationToken?: string;
  sessionId?: string;
  nextHref?: string;
};

const instructionBlocks = [
  {
    title: 'Assessment structure',
    body: 'The assessment is organised into two reasoning sections: abstract reasoning and numerical reasoning. Each section is completed under its own timing rules.',
  },
  {
    title: 'Section timing',
    body: 'Timing is controlled by the platform. Once a timed section begins, the remaining time is calculated from backend session state rather than from the browser alone.',
  },
  {
    title: 'Skipping and returning',
    body: 'Navigation rules are enforced by the assessment interface. If returning to previous items is allowed within a section, the navigation controls will make this clear. If it is restricted, unavailable actions will remain disabled.',
  },
  {
    title: 'Answer saving',
    body: 'Your selected answers are saved during the assessment. The interface will show a save-state indicator where appropriate so you can see whether your latest answer has been captured.',
  },
  {
    title: 'When time expires',
    body: 'When the valid time for a section expires, that section should no longer remain interactable. The platform will move the assessment forward according to the active session rules.',
  },
  {
    title: 'Final submission',
    body: 'Submission is final. Once the assessment is submitted and the session is closed, responses cannot be changed. You will be asked to confirm before final submission.',
  },
];

export function AssessmentInstructionsScreen({
  mode,
  invitationToken,
  sessionId,
  nextHref,
}: AssessmentInstructionsScreenProps) {
  const accessLabel =
    mode === 'invitation'
      ? 'Employer invitation'
      : mode === 'session'
        ? 'Existing session'
        : 'Consumer assessment';

  return (
    <div className="mx-auto w-full max-w-5xl">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
            Assessment instructions
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50">
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
              className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
            >
              <h3 className="text-sm font-semibold text-slate-100">
                {block.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {block.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <h3 className="text-sm font-semibold text-slate-100">
            Current access context
          </h3>

          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-slate-500">Access type</dt>
              <dd className="mt-1 text-slate-100">{accessLabel}</dd>
            </div>

            <div>
              <dt className="text-slate-500">Readiness status</dt>
              <dd className="mt-1 text-slate-100">
                Instructions not yet confirmed
              </dd>
            </div>

            {invitationToken ? (
              <div className="md:col-span-2">
                <dt className="text-slate-500">Invitation token</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-100">
                  {invitationToken}
                </dd>
              </div>
            ) : null}

            {sessionId ? (
              <div className="md:col-span-2">
                <dt className="text-slate-500">Session ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-100">
                  {sessionId}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-slate-500">
            The next step will ask you to explicitly confirm readiness before
            the timed session begins. Do not continue unless you are prepared to
            start under the assessment timing rules.
          </p>

          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center justify-center rounded-xl bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
            >
              Continue
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="rounded-xl bg-slate-700 px-5 py-3 text-sm font-medium text-slate-300 opacity-70"
            >
              Continue
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
