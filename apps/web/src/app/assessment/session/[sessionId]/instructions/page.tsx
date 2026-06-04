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
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          IQMeridian Assessment
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          {session.assessmentTitle}
        </h1>

        {session.candidateName ? (
          <p className="mt-4 text-base text-slate-700">
            Candidate:{' '}
            <span className="font-medium text-slate-950">
              {session.candidateName}
            </span>
          </p>
        ) : null}

        <div className="mt-8 space-y-4 text-sm leading-6 text-slate-700">
          <p>
            Read the instructions carefully before beginning. Once you confirm
            readiness, the timed assessment session will begin.
          </p>

          <p>
            Use a stable internet connection, avoid refreshing the browser, and
            complete the assessment without external assistance.
          </p>

          <p>
            The assessment contains timed sections. Section movement and final
            submission are controlled by the system.
          </p>
        </div>

        <ReadinessConfirmation
          sessionId={session.sessionId}
          mode="start"
          buttonLabel="I confirm I am ready to begin"
        />
      </section>
    </main>
  );
}
