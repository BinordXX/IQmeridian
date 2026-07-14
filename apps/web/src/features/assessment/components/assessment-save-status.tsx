'use client';

import type { AssessmentFlowStatus } from '../state/assessment-flow-state';

type AssessmentSaveStatusProps = {
  status: AssessmentFlowStatus;
  lastSavedAt?: string;
};

export const AssessmentSaveStatus = ({
  status,
  lastSavedAt,
}: AssessmentSaveStatusProps) => {
  if (status === 'saving') {
    return <p className="text-sm font-bold text-cyan-100">Saving...</p>;
  }

  if (status === 'saved' && lastSavedAt) {
    return (
      <p className="text-sm font-bold text-emerald-100">
        Saved at {new Date(lastSavedAt).toLocaleTimeString()}
      </p>
    );
  }

  if (status === 'error') {
    return (
      <p className="text-sm font-bold text-red-100">
        Save failed. Check your connection.
      </p>
    );
  }

  return <p className="text-sm font-bold text-slate-400">Ready</p>;
};
