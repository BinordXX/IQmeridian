"use client";

import { useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import {
  finaliseAssessmentSession,
  saveAssessmentResponse,
} from "../api/assessment-api";
import type {
  AssessmentResponseValue,
  AssessmentSessionPayload,
  CandidateSafeAssessmentItem,
} from "../contracts/assessment-contracts";
import {
  initialAssessmentFlowState,
  reduceAssessmentFlowState,
} from "../state/assessment-flow-state";
import { AssessmentProgressPanel } from "./assessment-progress-panel";
import { AssessmentSaveStatus } from "./assessment-save-status";
import { CandidateItemCard } from "./candidate-item-card";

type LiveAssessmentShellProps = {
  session: AssessmentSessionPayload;
};

const flattenItems = (
  session: AssessmentSessionPayload,
): CandidateSafeAssessmentItem[] => {
  return session.sections.flatMap((section) => section.items);
};

const findFirstItem = (
  session: AssessmentSessionPayload,
): CandidateSafeAssessmentItem | undefined => {
  return flattenItems(session)[0];
};

const getInitialItem = (
  session: AssessmentSessionPayload,
): CandidateSafeAssessmentItem | undefined => {
  const items = flattenItems(session);

  if (session.currentItemId) {
    return (
      items.find((item) => item.itemId === session.currentItemId) ?? items[0]
    );
  }

  return items[0];
};

export const LiveAssessmentShell = ({ session }: LiveAssessmentShellProps) => {
  const router = useRouter();

  const [flowState, dispatch] = useReducer(reduceAssessmentFlowState, {
    ...initialAssessmentFlowState,
    status: "active",
    sessionId: session.sessionId,
    assessmentId: session.assessmentId,
    currentSectionId: session.currentSectionId,
    currentItemId: session.currentItemId ?? findFirstItem(session)?.itemId,
    expiresAt: session.expiresAt,
  });

  const items = useMemo(() => flattenItems(session), [session]);
  const initialItem = useMemo(() => getInitialItem(session), [session]);

  const [currentItemId, setCurrentItemId] = useState<string | undefined>(
    initialItem?.itemId,
  );

  const [responses, setResponses] = useState<
    Record<string, AssessmentResponseValue>
  >({});

  const currentItem =
    items.find((item) => item.itemId === currentItemId) ?? items[0];

  const currentItemIndex = currentItem
    ? items.findIndex((item) => item.itemId === currentItem.itemId)
    : -1;

  const currentResponse = currentItem
    ? responses[currentItem.itemId] ?? null
    : null;

  const selectItem = (sectionId: string, itemId: string): void => {
    setCurrentItemId(itemId);

    dispatch({
      type: "STARTED",
      sessionId: session.sessionId,
      assessmentId: session.assessmentId,
      currentSectionId: sectionId,
      currentItemId: itemId,
      expiresAt: session.expiresAt,
    });
  };

  const saveResponse = async (
    item: CandidateSafeAssessmentItem,
    value: AssessmentResponseValue,
  ): Promise<void> => {
    setResponses((previous) => ({
      ...previous,
      [item.itemId]: value,
    }));

    dispatch({ type: "SAVE_STARTED" });

    try {
      const saved = await saveAssessmentResponse(session.sessionId, {
        sectionId: item.sectionId,
        itemId: item.itemId,
        responseValue: value,
        clientSavedAt: new Date().toISOString(),
      });

      dispatch({
        type: "SAVE_SUCCEEDED",
        savedAt: saved.response.savedAt,
      });
    } catch {
      dispatch({
        type: "FAILED",
        message: "The response could not be saved.",
        code: "SAVE_FAILED",
      });
    }
  };

  const goToPrevious = (): void => {
    if (currentItemIndex <= 0) {
      return;
    }

    const previousItem = items[currentItemIndex - 1];

    if (!previousItem) {
      return;
    }

    selectItem(previousItem.sectionId, previousItem.itemId);
  };

  const goToNext = (): void => {
    if (currentItemIndex < 0 || currentItemIndex >= items.length - 1) {
      return;
    }

    const nextItem = items[currentItemIndex + 1];

    if (!nextItem) {
      return;
    }

    selectItem(nextItem.sectionId, nextItem.itemId);
  };

  const submitAssessment = async (): Promise<void> => {
    dispatch({ type: "SUBMIT_STARTED" });

    try {
      await finaliseAssessmentSession(session.sessionId);
      dispatch({ type: "COMPLETED" });
      router.replace("/assessment/status?reason=completed");
    } catch {
      dispatch({
        type: "FAILED",
        message: "The assessment could not be submitted.",
        code: "SUBMIT_FAILED",
      });
    }
  };

  if (!currentItem) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">
            No assessment items available
          </h1>

          <p className="mt-4 text-slate-600">
            This session was validated, but no candidate-safe items were returned
            for display.
          </p>
        </section>
      </main>
    );
  }

  const isSubmitting = flowState.status === "submitting";
  const isSaving = flowState.status === "saving";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              IQMeridian Assessment
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              {session.assessmentTitle}
            </h1>

            {session.candidateName ? (
              <p className="mt-2 text-sm text-slate-600">
                Candidate:{" "}
                <span className="font-medium text-slate-900">
                  {session.candidateName}
                </span>
              </p>
            ) : null}
          </div>

          <AssessmentSaveStatus
            status={flowState.status}
            lastSavedAt={flowState.lastSavedAt}
          />
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            <CandidateItemCard
              item={currentItem}
              responseValue={currentResponse}
              onResponseChange={(value) => saveResponse(currentItem, value)}
              disabled={isSubmitting}
            />

            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={currentItemIndex <= 0 || isSubmitting || isSaving}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <p className="text-center text-sm font-medium text-slate-500">
                Question {currentItemIndex + 1} of {items.length}
              </p>

              {currentItemIndex === items.length - 1 ? (
                <button
                  type="button"
                  onClick={submitAssessment}
                  disabled={isSubmitting || isSaving}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? "Submitting..." : "Submit assessment"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={isSubmitting || isSaving}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Next
                </button>
              )}
            </div>

            {flowState.error ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {flowState.error.message}
              </p>
            ) : null}
          </section>

          <AssessmentProgressPanel
            sections={session.sections}
            currentItemId={currentItem.itemId}
            responses={responses}
            onSelectItem={selectItem}
          />
        </div>
      </div>
    </main>
  );
};