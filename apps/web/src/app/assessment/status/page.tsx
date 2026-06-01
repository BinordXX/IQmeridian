import Link from 'next/link';

type AssessmentStatusReason =
  | 'invalid'
  | 'expired'
  | 'completed'
  | 'unauthorised'
  | 'cancelled'
  | 'server_error';

type AssessmentStatusCopy = {
  title: string;
  body: string;
};

type AssessmentStatusPageProps = {
  searchParams: Promise<{
    reason?: string;
    message?: string;
  }>;
};

const statusCopy: Record<AssessmentStatusReason, AssessmentStatusCopy> = {
  invalid: {
    title: 'Assessment unavailable',
    body: 'This assessment link or session could not be validated.',
  },
  expired: {
    title: 'Assessment expired',
    body: 'This assessment is no longer available because the permitted access window has expired.',
  },
  completed: {
    title: 'Assessment already completed',
    body: 'This assessment session has already been submitted or completed.',
  },
  unauthorised: {
    title: 'Access not authorised',
    body: 'You are not authorised to access this assessment session.',
  },
  cancelled: {
    title: 'Assessment cancelled',
    body: 'This assessment invitation or session has been cancelled.',
  },
  server_error: {
    title: 'Assessment temporarily unavailable',
    body: 'The assessment service could not complete the validation request.',
  },
};

const isAssessmentStatusReason = (
  value: string | undefined
): value is AssessmentStatusReason => {
  return (
    value === 'invalid' ||
    value === 'expired' ||
    value === 'completed' ||
    value === 'unauthorised' ||
    value === 'cancelled' ||
    value === 'server_error'
  );
};

export default async function AssessmentStatusPage({
  searchParams,
}: AssessmentStatusPageProps) {
  const params = await searchParams;
  const reason: AssessmentStatusReason = isAssessmentStatusReason(params.reason)
    ? params.reason
    : 'invalid';

  const copy = statusCopy[reason];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          IQMeridian Assessment
        </p>

        <h1 className="mt-3 text-2xl font-bold text-slate-950">{copy.title}</h1>

        <p className="mt-4 leading-7 text-slate-600">
          {params.message ?? copy.body}
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
