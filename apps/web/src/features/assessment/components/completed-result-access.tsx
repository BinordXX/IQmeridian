'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  AssessmentApiError,
  getCandidateResultSummary,
} from '../api/assessment-api';
import type { CandidateResultSummaryResult } from '../contracts/assessment-contracts';

type CompletedResultAccessProps = {
  sessionId?: string;
  audience: 'employer-invited' | 'consumer';
};

const getHiddenMessage = (
  reason?: CandidateResultSummaryResult['reason'],
  audience: 'employer-invited' | 'consumer' = 'employer-invited'
) => {
  if (reason === 'not_scored') {
    if (audience === 'consumer') {
      return 'Your assessment has been submitted, but your result is not ready yet. Once scoring is available, your IQMeridian dashboard will show your current profile and result summary.';
    }

    return 'The assessment has been submitted, but the candidate result summary is not ready yet. If a candidate-facing summary is released, it will be available through the result page.';
  }

  if (reason === 'not_completed') {
    return 'This assessment session has not reached a completed state, so a result summary cannot be shown.';
  }

  if (audience === 'consumer') {
    return 'Immediate result release is not enabled for this assessment attempt. If a summary becomes available, it will be shown through your IQMeridian result page.';
  }

  return 'Immediate candidate results are not enabled for this employer-invited assessment. If results or feedback are released, they will be communicated through the process defined by the assessment administrator.';
};

export const CompletedResultAccess = ({
  sessionId,
  audience,
}: CompletedResultAccessProps) => {
  const [summary, setSummary] = useState<CandidateResultSummaryResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(Boolean(sessionId));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const controller = new AbortController();

    const checkResultAccess = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await getCandidateResultSummary(
          sessionId,
          controller.signal
        );

        setSummary(result);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof AssessmentApiError) {
          if (error.status === 401 || error.status === 403) {
            setErrorMessage(
              'This result summary requires the original assessment browser session or a valid result access link.'
            );
            return;
          }
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'The result summary could not be checked.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void checkResultAccess();

    return () => {
      controller.abort();
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-white/[0.035] p-5">
        <h2 className="text-lg font-black text-white">
          Checking result access
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          The system is checking whether a result summary is available for this
          completed assessment.
        </p>
      </div>
    );
  }

  if (summary?.visibility === 'summary' && sessionId) {
    const isConsumer = summary.audience === 'consumer' || audience === 'consumer';

    return (
      <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-white/[0.035] p-5">
        <h2 className="text-lg font-black text-white">
          {isConsumer ? 'Your result summary is ready' : 'Result summary available'}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          {isConsumer
            ? 'Your IQMeridian result summary is available. Open it to review your current assessment profile.'
            : 'A limited candidate result summary is available for this assessment. This view only includes the information candidates are permitted to see.'}
        </p>

        <Link
          href={`/assessment/session/${encodeURIComponent(sessionId)}/report`}
          className="mt-4 inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
        >
          {isConsumer ? 'View my result' : 'View result summary'}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-white/[0.035] p-5">
      <h2 className="text-lg font-black text-white">Result visibility</h2>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        {errorMessage ?? getHiddenMessage(summary?.reason, audience)}
      </p>
    </div>
  );
};