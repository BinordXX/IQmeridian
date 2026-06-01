import { redirect } from "next/navigation";
import { ReadinessConfirmation } from "@/features/assessment/components/readiness-confirmation";
import { guardSessionInstructionsRoute } from "@/features/assessment/guards/assessment-route-guards";

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
  const isResumable = session.status === "active" || session.status === "paused";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          IQMeridian Assessment
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          {session.assessmentTitle}
        </h1>

        {session.candidateName ? (
          <p className="mt-3 text-slate-600">
            Candidate:{" "}
            <span className="font-medium text-slate-900">
              {session.candidateName}
            </span>
          </p>
        ) : null}

        <div className="mt-8 space-y-4 text-sm leading-7 text-slate-700">
          <p>
            This page marks the controlled transition between reading the
            instructions and entering the timed assessment environment.
          </p>

          <p>
            Confirm readiness only when you are prepared to continue without
            interruption.
          </p>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">
            Assessment sections
          </h2>

          <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {session.sections.map((section) => (
              <div key={section.sectionId} className="p-4">
                <p className="font-medium text-slate-950">{section.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {section.itemCount} items
                  {section.timeLimitSeconds
                    ? ` · ${Math.round(section.timeLimitSeconds / 60)} minutes`
                    : ""}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {section.instructions}
                </p>
              </div>
            ))}
          </div>
        </section>

        <ReadinessConfirmation
          sessionId={sessionId}
          mode={isResumable ? "resume" : "start"}
          buttonLabel={
            isResumable
              ? "Resume assessment"
              : "I confirm I am ready to begin"
          }
        />
      </section>
    </main>
  );
}