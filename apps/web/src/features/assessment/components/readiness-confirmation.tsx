'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  AssessmentApiError,
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
  const [applicantName, setApplicantName] = useState('');
  const [hasConfirmedIdentityAndConsent, setHasConfirmedIdentityAndConsent] =
    useState(false);

  const beginAssessment = async (): Promise<void> => {
    if (!hasConfirmedReadiness || isStarting) {
      return;
    }

    if (invitationToken) {
      if (applicantName.trim().length < 2) {
        setErrorMessage('Enter your full name before beginning.');
        return;
      }

      if (!hasConfirmedIdentityAndConsent) {
        setErrorMessage('Confirm your identity and consent before beginning.');
        return;
      }
    }

    setIsStarting(true);
    setErrorMessage(null);

    try {
      let activeSessionId = sessionId;

      if (!activeSessionId && invitationToken) {
        const createdSession = await createAssessmentSession({
          invitationToken,
          applicantName: applicantName.trim(),
          consentAccepted: hasConfirmedIdentityAndConsent,
        });

        activeSessionId = createdSession.sessionId;

        if (createdSession.status === 'completed') {
          throw new Error(
            'This invitation already has a completed assessment session. Ask the employer to issue a new invitation if you need to retake it.'
          );
        }

        if (createdSession.status === 'expired') {
          throw new Error('This assessment session has expired.');
        }

        if (createdSession.status === 'cancelled') {
          throw new Error('This assessment session is no longer available.');
        }

        if (createdSession.status === 'active') {
          router.replace(
            `/assessment/session/${encodeURIComponent(activeSessionId)}`
          );
          return;
        }
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
    } catch (error) {
      let message =
        'The assessment could not be started. Please refresh the page and try again.';

      if (error instanceof AssessmentApiError) {
        const payload = error.payload as
          | {
              message?: string | string[];
              error?: string;
            }
          | string
          | null;

        if (typeof payload === 'string') {
          message = payload;
        } else if (Array.isArray(payload?.message)) {
          message = payload.message.join(' ');
        } else if (payload?.message) {
          message = payload.message;
        } else if (payload?.error) {
          message = payload.error;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      setErrorMessage(message);
      setIsStarting(false);
    }
  };

  return (
    <section className="mt-8 rounded-[1.5rem] border border-cyan-300/15 bg-[#020817]/75 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:rounded-[2rem] sm:p-6">
      <h2 className="text-lg font-black text-white">Readiness confirmation</h2>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
        Confirm that you have read the instructions, are in a suitable
        environment, and are ready for the timed assessment to begin.
      </p>

      {invitationToken ? (
        <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div>
            <label className="text-sm font-black text-cyan-100">
              Full name
            </label>

            <input
              type="text"
              value={applicantName}
              onChange={(event) => setApplicantName(event.currentTarget.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#07142f] px-4 py-3 text-base font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 sm:text-sm"
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#020817]/60 p-4 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              checked={hasConfirmedIdentityAndConsent}
              onChange={(event) =>
                setHasConfirmedIdentityAndConsent(event.currentTarget.checked)
              }
              className="mt-1 h-5 w-5 shrink-0 rounded border-cyan-300/30 bg-[#020817] accent-cyan-300"
            />

            <span>
              I confirm that I am the invited candidate and I consent to taking
              this assessment for the inviting organisation.
            </span>
          </label>
        </div>
      ) : null}

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
        <input
          type="checkbox"
          checked={hasConfirmedReadiness}
          onChange={(event) =>
            setHasConfirmedReadiness(event.currentTarget.checked)
          }
          className="mt-1 h-5 w-5 shrink-0 rounded border-cyan-300/30 bg-[#020817] accent-cyan-300"
        />

        <span>
          I understand that the timed assessment will begin after confirmation.
        </span>
      </label>

      {errorMessage ? (
        <p className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold leading-6 text-red-100">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="button"
        onClick={beginAssessment}
        disabled={
          !hasConfirmedReadiness ||
          isStarting ||
          (Boolean(invitationToken) &&
            (applicantName.trim().length < 2 ||
              !hasConfirmedIdentityAndConsent))
        }
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-center text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600 sm:w-auto"
      >
        {isStarting ? 'Preparing assessment...' : buttonLabel}
      </button>
    </section>
  );
};
