import { EmployerStatePanel } from '@/features/employer/components/employer-state-panel';

export default function EmployerLoadingPage() {
  return (
    <EmployerStatePanel
      eyebrow="Employer workspace"
      title="Loading employer workspace"
      body="The system is retrieving campaign, candidate, session, and reporting data for this employer account."
      tone="neutral"
    />
  );
}
