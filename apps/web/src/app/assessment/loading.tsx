import { AssessmentStatePanel } from '@/features/assessment/components/assessment-state-panel';

export default function AssessmentLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <AssessmentStatePanel
        eyebrow="Loading assessment"
        title="Preparing your assessment session"
        body="The system is retrieving the valid session state, item sequence, timing information, and access status. This may take a few moments."
        tone="neutral"
        action={
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
        }
      />
    </main>
  );
}
