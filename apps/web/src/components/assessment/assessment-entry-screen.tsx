type AssessmentEntryScreenProps = {
  mode: 'invitation' | 'consumer';
  invitationToken?: string;
};

export function AssessmentEntryScreen({
  mode,
  invitationToken,
}: AssessmentEntryScreenProps) {
  const isInvitation = mode === 'invitation';

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
            performance across the currently assigned reasoning domains. Once
            started, your responses may be saved during the session and
            finalised when you submit.
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
              The backend controls section timing. Time limits become active
              once the session starts.
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
          <p className="text-sm font-medium text-slate-200">
            Access context
          </p>

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
                Ready for session setup
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
            By continuing, the platform will create or resume an authorised
            assessment session using the backend session lifecycle.
          </p>

          <button
            type="button"
            disabled
            className="rounded-xl bg-slate-700 px-5 py-3 text-sm font-medium text-slate-300 opacity-70"
          >
            Start assessment
          </button>
        </div>

        <p className="mt-3 text-right text-xs text-slate-500">
          Start action will be connected after the assessment API client is
          added.
        </p>
      </section>
    </div>
  );
}