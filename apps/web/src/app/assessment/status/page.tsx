import Link from 'next/link';

type AssessmentStatusReason =
  | 'completed'
  | 'expired'
  | 'invalid'
  | 'unauthorised'
  | 'not-found'
  | 'already-submitted'
  | 'invalid-invitation'
  | 'expired-invitation'
  | 'lost-session'
  | 'save-failed'
  | 'section-timeout'
  | 'submit-failed'
  | 'error';

type CandidateResultVisibility = 'summary' | 'hidden';
type CandidateAudience = 'employer-invited' | 'consumer';

type AssessmentStatusPageProps = {
  searchParams?: Promise<{
    reason?: string;
    sessionId?: string;
    resultVisibility?: string;
    audience?: string;
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
    case 'invalid-invitation':
    case 'expired-invitation':
    case 'lost-session':
    case 'save-failed':
    case 'section-timeout':
    case 'submit-failed':
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

const normaliseAudience = (audience?: string): CandidateAudience => {
  return audience === 'consumer' ? 'consumer' : 'employer-invited';
};

const getStatusCopy = (
  reason: AssessmentStatusReason
): {
  eyebrow: string;
  title: string;
  body: string;
  tone: 'success' | 'warning' | 'error' | 'neutral';
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

    case 'invalid-invitation':
      return {
        eyebrow: 'Invalid invitation',
        title: 'This assessment invitation is not valid',
        body: 'The invitation link could not be verified. It may have been copied incorrectly or may no longer be linked to an available assessment.',
        tone: 'warning',
      };

    case 'expired-invitation':
      return {
        eyebrow: 'Expired invitation',
        title: 'This invitation has expired',
        body: 'The assessment invitation is outside its valid access window. A new invitation is required before this assessment can be started.',
        tone: 'warning',
      };

    case 'lost-session':
      return {
        eyebrow: 'Session recovery failed',
        title: 'The active session could not be restored',
        body: 'The system could not recover a valid active session. This may happen after a long interruption, expired timing window, or invalid session state.',
        tone: 'error',
      };

    case 'save-failed':
      return {
        eyebrow: 'Autosave issue',
        title: 'Your response could not be saved',
        body: 'The selected answer may still be visible locally, but the system could not confirm that it was saved. Reopen the assessment only through the valid session link.',
        tone: 'error',
      };

    case 'section-timeout':
      return {
        eyebrow: 'Section timeout',
        title: 'This section has ended',
        body: 'The section timing window has ended. The system must now use the backend-defined session state before any further assessment action is allowed.',
        tone: 'warning',
      };

    case 'submit-failed':
      return {
        eyebrow: 'Submission issue',
        title: 'The assessment could not be submitted',
        body: 'The system could not confirm final submission. If this persists, use the original assessment link so the system can recover the latest valid session state.',
        tone: 'error',
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

const getToneClasses = (
  tone: 'success' | 'warning' | 'error' | 'neutral'
): string => {
  switch (tone) {
    case 'success':
      return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100';
    case 'warning':
      return 'border-amber-300/25 bg-amber-400/10 text-amber-100';
    case 'error':
      return 'border-red-300/25 bg-red-400/10 text-red-100';
    case 'neutral':
    default:
      return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
  }
};

export default async function AssessmentStatusPage({
  searchParams,
}: AssessmentStatusPageProps) {
  const params = searchParams ? await searchParams : {};
  const reason = normaliseReason(params.reason);
  const resultVisibility = normaliseResultVisibility(params.resultVisibility);
  const audience = normaliseAudience(params.audience);
  const copy = getStatusCopy(reason);

  const canShowResultSummary =
    reason === 'completed' &&
    resultVisibility === 'summary' &&
    Boolean(params.sessionId);

  const shouldHideResults =
    reason === 'completed' && resultVisibility !== 'summary';

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-3xl rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:rounded-[2rem] sm:p-8">
        <div
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${getToneClasses(
            copy.tone
          )}`}
        >
          {copy.eyebrow}
        </div>

        <h1 className="mt-5 text-3xl font-black text-white">{copy.title}</h1>

        <p className="mt-4 text-base leading-7 text-slate-300">{copy.body}</p>

        {reason === 'completed' ? (
          <div className="mt-8 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-5">
            <h2 className="text-lg font-black text-white">
              Submission confirmed
            </h2>

            <p className="mt-2 text-sm leading-6 text-emerald-50/80">
              Your responses have been submitted for processing. You do not need
              to retake or resubmit this assessment unless the assessment
              administrator explicitly asks you to do so.
            </p>
          </div>
        ) : null}

        {canShowResultSummary ? (
          <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-white/[0.035] p-5">
            <h2 className="text-lg font-black text-white">
              Result summary available
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              A limited candidate result summary is available for this
              assessment. This view is restricted to the result information that
              candidates are permitted to see.
            </p>

            <Link
              href={`/assessment/session/${encodeURIComponent(
                params.sessionId ?? ''
              )}/report`}
              className="mt-4 inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
            >
              View result summary
            </Link>
          </div>
        ) : null}

        {shouldHideResults ? (
          <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-white/[0.035] p-5">
            <h2 className="text-lg font-black text-white">Result visibility</h2>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {audience === 'consumer'
                ? 'Immediate result release is not enabled for this assessment attempt. If a summary becomes available, it will be shown through the candidate result page.'
                : 'Immediate candidate results are not enabled for this employer-invited assessment. If results or feedback are released, they will be communicated through the process defined by the assessment administrator.'}
            </p>
          </div>
        ) : null}

        {reason !== 'completed' ? (
          <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-white/[0.035] p-5">
            <h2 className="text-lg font-black text-white">
              Controlled assessment state
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              This page is shown deliberately so that invalid invitations,
              expired access, failed saves, lost sessions, timed-out sections,
              completed attempts, and inaccessible sessions do not fall through
              into a generic application error or live test screen.
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
          >
            Back to dashboard
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/[0.07]"
          >
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
