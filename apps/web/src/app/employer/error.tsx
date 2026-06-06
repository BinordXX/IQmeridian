'use client';

import { EmployerStatePanel } from '@/features/employer/components/employer-state-panel';

type EmployerErrorPageProps = {
  reset: () => void;
};

export default function EmployerErrorPage({ reset }: EmployerErrorPageProps) {
  return (
    <EmployerStatePanel
      eyebrow="Employer workspace error"
      title="This employer page could not be loaded"
      body="The workspace encountered an operational error while loading employer data. This may be caused by API availability, permissions, or incomplete campaign data."
      tone="danger"
      action={
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-red-950 px-5 py-3 text-sm font-semibold text-white hover:bg-red-900"
        >
          Try again
        </button>
      }
    />
  );
}
