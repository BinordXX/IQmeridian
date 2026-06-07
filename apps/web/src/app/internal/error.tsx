'use client';

import { useEffect } from 'react';

import { InternalStatePanel } from './_components/internal-state-panel';

export default function InternalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Internal tooling route failed', error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4">
      <InternalStatePanel
        variant="error"
        title="Internal tooling failed to load"
        message="The requested internal view could not be rendered. This usually means the API request failed, the database returned incomplete analytics data, or the current role is not authorised for this surface."
        actionHref="/internal"
        actionLabel="Return to internal dashboard"
      />

      <button
        type="button"
        onClick={reset}
        className="w-fit rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
      >
        Retry
      </button>

      {error.message ? (
        <pre className="overflow-auto rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-700">
          {error.message}
        </pre>
      ) : null}
    </div>
  );
}
