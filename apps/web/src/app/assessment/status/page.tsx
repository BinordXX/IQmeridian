import Link from 'next/link';

type AssessmentStatusReason =
  | 'completed'
  | 'expired'
  | 'invalid'
  | 'unauthorised'
  | 'not-found'
  | 'already-submitted'
  | 'error';

type CandidateResultVisibility = 'summary' | 'hidden';

type AssessmentStatusPageProps = {
  searchParams?: Promise<{
    reason?: string;
    sessionId?: string;
    resultVisibility?: string;
  }>;
};

const normaliseReason = (reason?: string): AssessmentStatusReason => {
  switch (reason) {
    case 'completed':
    case 'expired':
    case 'invalid':
    case 'unauthorised':
    case 'not-found':
    case 'already-submitted':
    case 'error':
      return reason;
    default:
      return 'error';
  }
};

const normaliseResultVisibility = (
  visibility?: string
): CandidateResultVisibility => {
  return visibility === 'summary' ? 'summary' : 'hidden';
};

const getStatusCopy = (
  reason: AssessmentStatusReason
): {
  eyebrow: string;
  title: string;
  body: string;
  tone: 'success' | 'warning' | 'neutral';
} => {
  switch (reason) {
    case 'completed':
      return {
        eyebrow: 'Assessment complete',
        title: 'Your assessment has been submitted',
        body: 'Your testing experience has ended. The system has received your attempt and completed the submission process.',
        tone: 'success',
      };

    case 'expired':
      return {
        eyebrow: 'Session expired',
        title: 'This assessment session has expired',
        body: 'The valid testing window for this session has ended. The assessment can no longer be continued from this link.',
        tone: 'warning',
      };

    case 'already-submitted':
      return {
        eyebrow: 'Already submitted',
        title: 'This assessment was already submitted',
        body: 'This session has already been finalised. It cannot be reopened or submitted again.',
        tone: 'neutral',
      };

    case 'unauthorised':
      return {
        eyebrow: 'Access restricted',
        title: 'You are not authorised to access this assessment',
        body: 'The assessment link could not be validated for this candidate session.',
        tone: 'warning',
      };

    case 'not-found':
      return {
        eyebrow: 'Session not found',
        title: 'This assessment session could not be found',
        body: 'The link may be incorrect, expired, or no longer associated with an active assessment session.',
        tone: 'warning',
      };

    case 'invalid':
      return {
        eyebrow: 'Invalid session',
        title: 'This assessment session is not valid',
        body: 'The system could not continue this assessment because the session state is no longer valid.',
        tone: 'warning',
      };

    case 'error':
    default:
      return {
        eyebrow: 'Assessment status',
        title: 'This assessment cannot be opened',
        body: 'The system could not resolve a valid assessment state. Please use the original invitation link or contact the assessment administrator.',
        tone: 'neutral',
      };
  }
};

const getToneClasses = (tone: 'success' | 'warning' | 'neutral'): string => {
  switch (tone) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';

    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-900';

    case 'neutral':
    default:
      return 'border-slate-200 bg-slate-50 text-slate-800';
  }
};

export default async function AssessmentStatusPage({
  searchParams,
}: AssessmentStatusPageProps) {
  const params = searchParams ? await searchParams : {};
  const reason = normaliseReason(params.reason);
  const resultVisibility = normaliseResultVisibility(params.resultVisibility);
  const copy = getStatusCopy(reason);

  const canShowResultSummary =
    reason === 'completed' &&
    resultVisibility === 'summary' &&
    Boolean(params.sessionId);

  const shouldHideResults =
    reason === 'completed' && resultVisibility !== 'summary';

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getToneClasses(
            copy.tone
          )}`}
        >
          {copy.eyebrow}
        </div>

        <h1 className="mt-5 text-3xl font-bold text-slate-950">{copy.title}</h1>

        <p className="mt-4 text-base leading-7 text-slate-600">{copy.body}</p>

        {reason === 'completed' ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Submission confirmed
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your responses have been submitted for processing. You do not need
              to retake or resubmit this assessment unless the assessment
              administrator explicitly asks you to do so.
            </p>
          </div>
        ) : null}

        {canShowResultSummary ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Result summary available
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              A limited candidate result summary is available for this
              assessment. This view is restricted to the result information that
              candidates are permitted to see.
            </p>

            <Link
              href={`/assessment/session/${encodeURIComponent(
                params.sessionId ?? ''
              )}/report`}
              className="mt-4 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View result summary
            </Link>
          </div>
        ) : null}

        {shouldHideResults ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Result visibility
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Immediate candidate results are not enabled for this assessment.
              If results or feedback are released, they will be communicated
              through the process defined by the assessment administrator.
            </p>
          </div>
        ) : null}

        {reason !== 'completed' ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              What this means
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This page is shown deliberately so that invalid, expired,
              completed, or inaccessible sessions do not fail silently or show a
              generic application error.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
