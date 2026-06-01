"use client";

import type { AssessmentFlowStatus } from "../state/assessment-flow-state";

type AssessmentSaveStatusProps = {
  status: AssessmentFlowStatus;
  lastSavedAt?: string;
};

export const AssessmentSaveStatus = ({
  status,
  lastSavedAt,
}: AssessmentSaveStatusProps) => {
  if (status === "saving") {
    return <p className="text-sm font-medium text-slate-500">Saving...</p>;
  }

  if (status === "saved" && lastSavedAt) {
    return (
      <p className="text-sm font-medium text-slate-500">
        Saved at {new Date(lastSavedAt).toLocaleTimeString()}
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-sm font-medium text-red-700">
        Save failed. Check your connection.
      </p>
    );
  }

  return <p className="text-sm font-medium text-slate-500">Ready</p>;
};