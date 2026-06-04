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
    <div className="mx-auto flex w-full max-w-4xl flex-1 items-center">
      <section className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
            Assessment entry
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50">
            You are about to begin the IQMeridian assessment
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            This assessment is designed to capture structured cognitive
            performance across the currently assigned reasoning domains. Before
            the timed session begins, you will review the assessment
            instructions and confirm that you are ready.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-medium text-slate-200">Format</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Abstract and numerical reasoning items, presented through the
              assigned assessment form.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-medium text-slate-200">Timing</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Section timing begins only after the readiness confirmation step.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-medium text-slate-200">Submission</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Submit only when ready. Closed sessions cannot accept further
              response changes.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-sm font-medium text-slate-200">Access context</p>

          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-slate-500">Access type</dt>
              <dd className="mt-1 text-slate-100">
                {isInvitation ? 'Employer invitation' : 'Consumer assessment'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Current status</dt>
              <dd className="mt-1 text-slate-100">
                Awaiting instruction review
              </dd>
            </div>

            {isInvitation ? (
              <div className="md:col-span-2">
                <dt className="text-slate-500">Invitation token</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-100">
                  {invitationToken}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-slate-500">
            Continue to the instruction screen before confirming readiness. The
            timed session will not start on this page.
          </p>

          <Link
            href={instructionsHref}
            className="inline-flex items-center justify-center rounded-xl bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
          >
            View instructions
          </Link>
        </div>
      </section>
    </div>
  );
}
