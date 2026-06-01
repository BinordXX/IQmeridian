"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { useBackendSyncedTimer } from "../hooks/use-backend-synced-timer";
import { AssessmentProgressIndicator } from "./assessment-progress-indicator";

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
import { AssessmentItemRenderer } from "./assessment-item-renderer";
import { AssessmentProgressPanel } from "./assessment-progress-panel";
import { AssessmentSaveStatus } from "./assessment-save-status";
import { AssessmentTimerPanel } from "./assessment-timer-panel";

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

  
  const handleTimerExpired = useCallback((): void => {
    dispatch({ type: "EXPIRED" });
  }, []);

  const timer = useBackendSyncedTimer({
    sessionId: session.sessionId,
    initialExpiresAt: session.timing?.sectionExpiresAt ?? session.expiresAt,
    initialServerNow: session.timing?.serverNow ?? session.serverNow,
    initialRemainingSeconds:
      session.timing?.sectionRemainingSeconds ??
      session.timing?.remainingSeconds,
    onExpired: handleTimerExpired,
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

  const currentSection = currentItem
    ? session.sections.find(
        (section) => section.sectionId === currentItem.sectionId,
      )
    : undefined;

    const currentSectionIndex = currentSection
  ? session.sections.findIndex(
      (section) => section.sectionId === currentSection.sectionId,
    )
  : -1;

const sectionItems = currentItem
  ? items.filter((item) => item.sectionId === currentItem.sectionId)
  : [];

const currentSectionItemIndex = currentItem
  ? sectionItems.findIndex((item) => item.itemId === currentItem.itemId)
  : -1;

  const answeredItemsCount = sectionItems.filter(
    (item) =>
      responses[item.itemId] !== undefined && responses[item.itemId] !== null,
  ).length;

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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
<AssessmentTimerPanel
  remainingSeconds={timer.remainingSeconds}
  syncStatus={timer.syncStatus}
  timingSource={timer.timingSource}
  lastSyncedAt={timer.lastSyncedAt}
/>

            <AssessmentSaveStatus
              status={flowState.status}
              lastSavedAt={flowState.lastSavedAt}
            />
          </div>
        </header>

       <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
  <div className="space-y-4">
    <AssessmentProgressIndicator
      sectionTitle={currentSection?.title}
      sectionPosition={{
        current: currentSectionIndex + 1,
        total: session.sections.length,
      }}
      currentItemNumber={currentSectionItemIndex + 1}
      totalItems={sectionItems.length}
      answeredItems={answeredItemsCount}
    />

    <AssessmentItemRenderer
      sectionTitle={currentSection?.title}
      sectionInstructions={currentSection?.instructions}
      item={currentItem}
      responseValue={currentResponse}
      currentItemIndex={currentItemIndex}
      totalItems={items.length}
      isSaving={isSaving}
      isSubmitting={isSubmitting}
      errorMessage={flowState.error?.message}
      onResponseChange={(value) => saveResponse(currentItem, value)}
      onPrevious={goToPrevious}
      onNext={goToNext}
      onSubmit={submitAssessment}
    />
  </div>

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