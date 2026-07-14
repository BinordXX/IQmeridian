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
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 sm:py-12">
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
            className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
          >
            Try loading again
          </button>
        }
      />
    </main>
  );
}
