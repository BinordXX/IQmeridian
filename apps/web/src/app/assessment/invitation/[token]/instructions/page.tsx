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
    <main className="mx-auto max-w-4xl px-6 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          IQMeridian Assessment
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          {invitation.assessmentTitle ?? 'Candidate assessment'}
        </h1>

        {invitation.candidateName ? (
          <p className="mt-3 text-slate-600">
            Candidate:{' '}
            <span className="font-medium text-slate-900">
              {invitation.candidateName}
            </span>
          </p>
        ) : null}

        <div className="mt-8 space-y-4 text-sm leading-7 text-slate-700">
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
            <h2 className="text-lg font-semibold text-slate-950">
              Assessment sections
            </h2>

            <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
              {invitation.sections.map((section) => (
                <div key={section.sectionId} className="p-4">
                  <p className="font-medium text-slate-950">{section.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {section.itemCount} items
                    {section.timeLimitSeconds
                      ? ` · ${Math.round(section.timeLimitSeconds / 60)} minutes`
                      : ''}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
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
