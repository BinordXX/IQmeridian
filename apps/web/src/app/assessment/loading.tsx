import { AssessmentStatePanel } from '@/features/assessment/components/assessment-state-panel';

export default function AssessmentLoading() {
  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 sm:py-12">
      <AssessmentStatePanel
        eyebrow="Loading assessment"
        title="Preparing your assessment session"
        body="The system is retrieving the valid session state, item sequence, timing information, and access status. This may take a few moments."
        tone="neutral"
        action={
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-300/25 border-t-cyan-200" />
        }
      />
    </main>
  );
}
