'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { AssessmentStatePanel } from './assessment-state-panel';

import {
  finaliseAssessmentSession,
  saveAssessmentResponse,
} from '../api/assessment-api';
import type {
  AssessmentResponseValue,
  AssessmentSessionPayload,
  CandidateSafeAssessmentItem,
} from '../contracts/assessment-contracts';
import { useBackendSyncedTimer } from '../hooks/use-backend-synced-timer';
import {
  initialAssessmentFlowState,
  reduceAssessmentFlowState,
} from '../state/assessment-flow-state';
import { AssessmentItemRenderer } from './assessment-item-renderer';
import { AssessmentProgressIndicator } from './assessment-progress-indicator';
import { AssessmentProgressPanel } from './assessment-progress-panel';
import { AssessmentSaveStatus } from './assessment-save-status';
import { AssessmentTimerPanel } from './assessment-timer-panel';

type LiveAssessmentShellProps = {
  session: AssessmentSessionPayload;
};

type SectionTransitionState = {
  fromSectionTitle: string;
  toSectionTitle: string;
  nextSectionId: string;
  nextItemId: string;
};

type SubmissionConfirmationState = {
  reachedFromSectionTitle: string;
};

type CandidateResultVisibility = 'summary' | 'hidden';

type FinaliseResultPayload = {
  candidateResultVisibility?: CandidateResultVisibility;
  resultVisibility?: CandidateResultVisibility;
};

const flattenItems = (
  session: AssessmentSessionPayload
): CandidateSafeAssessmentItem[] => {
  return session.sections.flatMap((section) => section.items);
};

const findFirstItem = (
  session: AssessmentSessionPayload
): CandidateSafeAssessmentItem | undefined => {
  return flattenItems(session)[0];
};

const getInitialItem = (
  session: AssessmentSessionPayload
): CandidateSafeAssessmentItem | undefined => {
  const items = flattenItems(session);

  if (session.currentItemId) {
    return (
      items.find((item) => item.itemId === session.currentItemId) ?? items[0]
    );
  }

  return items[0];
};

const isLiveSessionStatus = (status: string): boolean => {
  return status !== 'completed' && status !== 'expired';
};

const resolveCandidateResultVisibility = (
  finalisePayload: unknown
): CandidateResultVisibility => {
  const payload = finalisePayload as FinaliseResultPayload | undefined;

  if (payload?.candidateResultVisibility === 'summary') {
    return 'summary';
  }

  if (payload?.resultVisibility === 'summary') {
    return 'summary';
  }

  return 'hidden';
};

export const LiveAssessmentShell = ({ session }: LiveAssessmentShellProps) => {
  const router = useRouter();

  const [flowState, dispatch] = useReducer(reduceAssessmentFlowState, {
    ...initialAssessmentFlowState,
    status: 'active',
    sessionId: session.sessionId,
    assessmentId: session.assessmentId,
    currentSectionId: session.currentSectionId,
    currentItemId: session.currentItemId ?? findFirstItem(session)?.itemId,
    expiresAt: session.expiresAt,
  });

  const [sectionEndMessage, setSectionEndMessage] = useState<string | null>(
    null
  );

  const handleTimerExpired = useCallback((): void => {
    setSectionEndMessage(
      'This timed section has ended. The item interface is now locked while the system restores the valid session state from the server.'
    );

    dispatch({ type: 'EXPIRED' });

    window.setTimeout(() => {
      router.refresh();
    }, 500);
  }, [router]);

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
    initialItem?.itemId
  );

  const [responses, setResponses] = useState<
    Record<string, AssessmentResponseValue>
  >({});

  const [pendingSectionTransition, setPendingSectionTransition] =
    useState<SectionTransitionState | null>(null);

  const [pendingSubmissionConfirmation, setPendingSubmissionConfirmation] =
    useState<SubmissionConfirmationState | null>(null);

  const [navigationNotice, setNavigationNotice] = useState<string | null>(null);

  const saveSequenceRef = useRef(0);
  const latestSaveSequenceByItemRef = useRef<Record<string, number>>({});
  const finaliseInFlightRef = useRef(false);

  const currentItem =
    items.find((item) => item.itemId === currentItemId) ?? items[0];

  const currentItemIndex = currentItem
    ? items.findIndex((item) => item.itemId === currentItem.itemId)
    : -1;

  const currentSection = currentItem
    ? session.sections.find(
        (section) => section.sectionId === currentItem.sectionId
      )
    : undefined;

  const currentSectionIndex = currentSection
    ? session.sections.findIndex(
        (section) => section.sectionId === currentSection.sectionId
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
      responses[item.itemId] !== undefined && responses[item.itemId] !== null
  ).length;

  const totalAnsweredItemsCount = items.filter(
    (item) =>
      responses[item.itemId] !== undefined && responses[item.itemId] !== null
  ).length;

  const currentResponse = currentItem
    ? (responses[currentItem.itemId] ?? null)
    : null;

  const nextSection =
    currentSectionIndex >= 0
      ? session.sections[currentSectionIndex + 1]
      : undefined;

  const nextSectionFirstItem = nextSection?.items[0];

  const isFirstItemInSection = currentSectionItemIndex <= 0;
  const isLastItemInSection =
    currentSectionItemIndex >= 0 &&
    currentSectionItemIndex === sectionItems.length - 1;

  const hasNextSection = Boolean(nextSection && nextSectionFirstItem);
  const isSubmitting = flowState.status === 'submitting';
  const isSaving = flowState.status === 'saving';
  const isExpired = flowState.status === 'expired';
  const isCompleted = flowState.status === 'completed';
  const isLocked =
    isSubmitting ||
    isExpired ||
    isCompleted ||
    Boolean(sectionEndMessage) ||
    Boolean(pendingSectionTransition) ||
    Boolean(pendingSubmissionConfirmation);

  const selectItem = useCallback(
    (sectionId: string, itemId: string): void => {
      if (
        isLocked &&
        !pendingSectionTransition &&
        !pendingSubmissionConfirmation
      ) {
        return;
      }

      setPendingSectionTransition(null);
      setPendingSubmissionConfirmation(null);
      setNavigationNotice(null);
      setSectionEndMessage(null);
      setCurrentItemId(itemId);

      dispatch({
        type: 'STARTED',
        sessionId: session.sessionId,
        assessmentId: session.assessmentId,
        currentSectionId: sectionId,
        currentItemId: itemId,
        expiresAt: session.expiresAt,
      });
    },
    [
      isLocked,
      pendingSectionTransition,
      pendingSubmissionConfirmation,
      session.assessmentId,
      session.expiresAt,
      session.sessionId,
    ]
  );

  const selectPanelItem = (sectionId: string, itemId: string): void => {
    if (isLocked) {
      setNavigationNotice(
        'Navigation is temporarily locked while the assessment state is being finalised.'
      );
      return;
    }

    if (!currentItem || sectionId !== currentItem.sectionId) {
      setNavigationNotice(
        'You can only move within the current section. Section movement is controlled by the transition step.'
      );
      return;
    }

    selectItem(sectionId, itemId);
  };

  const saveResponse = async (
    item: CandidateSafeAssessmentItem,
    value: AssessmentResponseValue
  ): Promise<void> => {
    if (isLocked) {
      return;
    }

    saveSequenceRef.current += 1;

    const saveSequence = saveSequenceRef.current;
    latestSaveSequenceByItemRef.current[item.itemId] = saveSequence;

    setResponses((previous) => ({
      ...previous,
      [item.itemId]: value,
    }));

    dispatch({ type: 'SAVE_STARTED' });

    try {
      const saved = await saveAssessmentResponse(session.sessionId, {
        sectionId: item.sectionId,
        itemId: item.itemId,
        responseValue: value,
        clientSavedAt: new Date().toISOString(),
      });

      if (latestSaveSequenceByItemRef.current[item.itemId] !== saveSequence) {
        return;
      }

      dispatch({
        type: 'SAVE_SUCCEEDED',
        savedAt: saved.response.savedAt,
      });
    } catch {
      if (latestSaveSequenceByItemRef.current[item.itemId] !== saveSequence) {
        return;
      }

      dispatch({
        type: 'FAILED',
        message:
          'The answer is selected locally, but the system could not confirm autosave. Check your connection before continuing.',
        code: 'SAVE_FAILED',
      });
    }
  };

  const goToPrevious = (): void => {
    if (isLocked) {
      return;
    }

    if (!currentItem || isFirstItemInSection) {
      setNavigationNotice(
        'Backward movement is only available within the current section.'
      );
      return;
    }

    const previousItem = sectionItems[currentSectionItemIndex - 1];

    if (!previousItem) {
      return;
    }

    selectItem(previousItem.sectionId, previousItem.itemId);
  };

  const goToNext = (): void => {
    if (isLocked || !currentItem) {
      return;
    }

    if (!isLastItemInSection) {
      const nextItem = sectionItems[currentSectionItemIndex + 1];

      if (!nextItem) {
        return;
      }

      selectItem(nextItem.sectionId, nextItem.itemId);
      return;
    }

    if (nextSection && nextSectionFirstItem) {
      setPendingSectionTransition({
        fromSectionTitle: currentSection?.title ?? 'Current section',
        toSectionTitle: nextSection.title,
        nextSectionId: nextSection.sectionId,
        nextItemId: nextSectionFirstItem.itemId,
      });
      setNavigationNotice(null);
      return;
    }

    setPendingSubmissionConfirmation({
      reachedFromSectionTitle: currentSection?.title ?? 'Final section',
    });
    setNavigationNotice(null);
  };

  const continueToNextSection = (): void => {
    if (!pendingSectionTransition) {
      return;
    }

    selectItem(
      pendingSectionTransition.nextSectionId,
      pendingSectionTransition.nextItemId
    );
  };

  const returnToFinalItem = (): void => {
    setPendingSubmissionConfirmation(null);
    setNavigationNotice(null);
  };

  const submitAssessment = async (): Promise<void> => {
    if (finaliseInFlightRef.current || isSubmitting || isCompleted) {
      return;
    }

    finaliseInFlightRef.current = true;
    dispatch({ type: 'SUBMIT_STARTED' });

    try {
      const finaliseResult = await finaliseAssessmentSession(session.sessionId);

      const resultVisibility = resolveCandidateResultVisibility(finaliseResult);

      dispatch({ type: 'COMPLETED' });

      const statusParams = new URLSearchParams({
        reason: 'completed',
        sessionId: session.sessionId,
        resultVisibility,
      });

      router.replace(`/assessment/status?${statusParams.toString()}`);
    } catch {
      finaliseInFlightRef.current = false;

      dispatch({
        type: 'FAILED',
        message:
          'The assessment could not be submitted. Please try again while this session is still active.',
        code: 'SUBMIT_FAILED',
      });
    }
  };

  useEffect(() => {
    if (!isLiveSessionStatus(flowState.status)) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flowState.status]);

  useEffect(() => {
    if (!isLiveSessionStatus(flowState.status)) {
      return;
    }

    window.history.pushState(
      { assessmentGuard: true },
      '',
      window.location.href
    );

    const handlePopState = (): void => {
      const shouldLeave = window.confirm(
        'You are inside a live assessment session. Leaving now may interrupt the test context. Do you want to leave this page?'
      );

      if (shouldLeave) {
        window.removeEventListener('popstate', handlePopState);
        window.history.back();
        return;
      }

      window.history.pushState(
        { assessmentGuard: true },
        '',
        window.location.href
      );
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [flowState.status]);

  useEffect(() => {
    const recoverFromBackend = (): void => {
      if (!isLiveSessionStatus(flowState.status)) {
        return;
      }

      router.refresh();
    };

    const handleOnline = (): void => {
      recoverFromBackend();
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        recoverFromBackend();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flowState.status, router]);

  if (!currentItem) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <AssessmentStatePanel
          eyebrow="Missing session state"
          title="No assessment items are available"
          body="The session was reached, but the system could not resolve a valid item sequence. This state is handled deliberately so the candidate is not shown a broken test interface."
          tone="warning"
          action={
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Restore session state
            </button>
          }
        />
      </main>
    );
  }

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
                Candidate:{' '}
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

        {navigationNotice ? (
          <div
            className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            {navigationNotice}
          </div>
        ) : null}

        {isSubmitting ? (
          <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Submission processing
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-950">
              Finalising your assessment
            </h2>

            <p className="mt-4 text-slate-600">
              Your attempt has been received. The system is finalising the
              session, saving the final response state, and preparing the result
              status.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-600">
              <p className="font-medium text-slate-900">
                Please keep this page open.
              </p>
              <p className="mt-2">
                This prevents duplicate submission attempts while the backend
                completes finalisation, scoring, and report generation.
              </p>
            </div>
          </section>
        ) : sectionEndMessage ? (
          <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Section ended
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-950">
              Restoring valid session state
            </h2>

            <p className="mt-4 text-slate-600">{sectionEndMessage}</p>

            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Refresh session state
            </button>
          </section>
        ) : pendingSectionTransition ? (
          <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Section transition
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-950">
              {pendingSectionTransition.fromSectionTitle} complete
            </h2>

            <p className="mt-4 text-slate-600">
              You are about to move into{' '}
              <span className="font-semibold text-slate-900">
                {pendingSectionTransition.toSectionTitle}
              </span>
              . This transition is deliberate so that sections do not blur into
              one another.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-600">
              <p className="font-medium text-slate-900">Before continuing:</p>
              <p className="mt-2">
                Make sure you are ready to begin the next section. Once you
                continue, the active section context will change.
              </p>
            </div>

            <button
              type="button"
              onClick={continueToNextSection}
              className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Continue to {pendingSectionTransition.toSectionTitle}
            </button>
          </section>
        ) : pendingSubmissionConfirmation ? (
          <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Final submission
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-950">
              Ready to submit?
            </h2>

            <p className="mt-4 text-slate-600">
              You have reached the end of{' '}
              <span className="font-semibold text-slate-900">
                {pendingSubmissionConfirmation.reachedFromSectionTitle}
              </span>
              . Final review across sections is not enabled in this candidate
              flow, so submission must be confirmed deliberately.
            </p>

            <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <p className="font-medium text-slate-900">Answered items</p>
                <p className="mt-1">
                  {totalAnsweredItemsCount} of {items.length}
                </p>
              </div>

              <div>
                <p className="font-medium text-slate-900">Submission effect</p>
                <p className="mt-1">
                  The session will be finalised and scoring/report generation
                  will be triggered by the backend.
                </p>
              </div>
            </div>

            {flowState.error?.message ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {flowState.error.message}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={returnToFinalItem}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Return to final item
              </button>

              <button
                type="button"
                onClick={() => {
                  void submitAssessment();
                }}
                disabled={isSubmitting}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm and submit'}
              </button>
            </div>
          </section>
        ) : (
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
                isSubmitting={isSubmitting || isLocked}
                errorMessage={flowState.error?.message}
                onResponseChange={(value) => {
                  void saveResponse(currentItem, value);
                }}
                onPrevious={goToPrevious}
                onNext={goToNext}
                onSubmit={() => {
                  setPendingSubmissionConfirmation({
                    reachedFromSectionTitle:
                      currentSection?.title ?? 'Current section',
                  });
                }}
              />
            </div>

            <AssessmentProgressPanel
              sections={session.sections}
              currentItemId={currentItem.itemId}
              responses={responses}
              onSelectItem={selectPanelItem}
            />
          </div>
        )}
      </div>
    </main>
  );
};
