'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  createAssessmentSession,
  resumeAssessmentSession,
  startAssessmentSession,
} from '../api/assessment-api';

type ReadinessConfirmationProps = {
  invitationToken?: string;
  sessionId?: string;
  mode?: 'start' | 'resume';
  buttonLabel?: string;
};

export const ReadinessConfirmation = ({
  invitationToken,
  sessionId,
  mode = 'start',
  buttonLabel = 'I confirm I am ready to begin',
}: ReadinessConfirmationProps) => {
  const router = useRouter();
  const [hasConfirmedReadiness, setHasConfirmedReadiness] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const beginAssessment = async (): Promise<void> => {
    if (!hasConfirmedReadiness || isStarting) {
      return;
    }

    setIsStarting(true);
    setErrorMessage(null);

    try {
      let activeSessionId = sessionId;

      if (!activeSessionId && invitationToken) {
        const createdSession = await createAssessmentSession({
          invitationToken,
        });

        activeSessionId = createdSession.sessionId;
      }

      if (!activeSessionId) {
        throw new Error('No assessment session could be resolved.');
      }

      if (mode === 'resume') {
        await resumeAssessmentSession(activeSessionId);
      } else {
        await startAssessmentSession(activeSessionId);
      }

      router.replace(
        `/assessment/session/${encodeURIComponent(activeSessionId)}`
      );
    } catch {
      setErrorMessage(
        'The assessment could not be started. Please refresh the page and try again.'
      );
      setIsStarting(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">
        Readiness confirmation
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Confirm that you have read the instructions, are in a suitable
        environment, and are ready for the timed assessment to begin.
      </p>

      <label className="mt-5 flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={hasConfirmedReadiness}
          onChange={(event) =>
            setHasConfirmedReadiness(event.currentTarget.checked)
          }
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          I understand that the timed assessment will begin after confirmation.
        </span>
      </label>

      {errorMessage ? (
        <p className="mt-4 text-sm font-medium text-red-700">{errorMessage}</p>
      ) : null}

      <button
        type="button"
        onClick={beginAssessment}
        disabled={!hasConfirmedReadiness || isStarting}
        className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isStarting ? 'Preparing assessment...' : buttonLabel}
      </button>
    </section>
  );
};
