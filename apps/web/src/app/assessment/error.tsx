'use client';

import { AssessmentStatePanel } from '@/features/assessment/components/assessment-state-panel';

type AssessmentErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AssessmentErrorPage({
  error,
  reset,
}: AssessmentErrorPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <AssessmentStatePanel
        eyebrow="Assessment error"
        title="The assessment state could not be loaded"
        body={
          error.message ||
          'The system could not resolve the current assessment state. This may be caused by a lost session, expired access, or temporary connection problem.'
        }
        tone="error"
        action={
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Try loading again
          </button>
        }
      />
    </main>
  );
}
