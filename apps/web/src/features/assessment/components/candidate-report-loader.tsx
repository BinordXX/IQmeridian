'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  AssessmentApiError,
  getCandidateResultSummary,
} from '../api/assessment-api';
import type { CandidateResultSummaryResult } from '../contracts/assessment-contracts';
import { CandidateResultSummary } from './candidate-result-summary';

type CandidateReportLoaderProps = {
  sessionId: string;
};

const getHiddenCopy = (
  reason?: CandidateResultSummaryResult['reason'],
  audience?: CandidateResultSummaryResult['audience']
) => {
  const isConsumer = audience === 'consumer';

  switch (reason) {
    case 'not_completed':
      return {
        title: 'Assessment not completed',
        body: 'This session has not reached a completed state, so a result summary cannot be shown.',
      };

    case 'not_scored':
      return {
        title: isConsumer ? 'Result not ready yet' : 'Result not ready yet',
        body: isConsumer
          ? 'Your assessment has been submitted, but your result is not ready yet. Once scoring is available, your IQMeridian dashboard will show your current profile and result summary.'
          : 'The assessment has been submitted, but a candidate-facing summary is not available yet. The assessment administrator may still review the completed attempt.',
      };

    case 'policy_hidden':
    default:
      return {
        title: isConsumer
          ? 'Result summary is not available'
          : 'Candidate results are hidden',
        body: isConsumer
          ? 'Immediate result release is not enabled for this assessment attempt.'
          : 'This employer-invited assessment does not currently release immediate candidate result summaries. If feedback is released, it will be communicated through the process defined by the assessment administrator.',
      };
  }
};

const StatusCard = ({
  eyebrow,
  title,
  body,
  tone = 'neutral',
}: {
  eyebrow: string;
  title: string;
  body: string;
  tone?: 'neutral' | 'error' | 'success';
}) => {
  const toneClass =
    tone === 'error'
      ? 'border-red-300/20 bg-red-400/10 text-red-100'
      : tone === 'success'
        ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
        : 'border-cyan-300/15 bg-[#07142f]/95 text-slate-300';

  return (
    <section className={`rounded-[1.5rem] border p-5 sm:rounded-[2rem] sm:p-8 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
        {eyebrow}
      </p>

      <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">
        {title}
      </h1>

      <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
        {body}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/assessment/status?reason=completed&resultVisibility=hidden"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
        >
          Assessment status
        </Link>

        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/[0.07]"
        >
          Go home
        </Link>
      </div>
    </section>
  );
};

export const CandidateReportLoader = ({
  sessionId,
}: CandidateReportLoaderProps) => {
  const [summary, setSummary] = useState<CandidateResultSummaryResult | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadSummary = async () => {
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
              'This result page requires the original assessment session access token or a signed-in account that owns the session.'
            );
            return;
          }

          if (error.status === 404) {
            setErrorMessage('This assessment session could not be found.');
            return;
          }
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'The candidate result summary could not be loaded.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadSummary();

    return () => {
      controller.abort();
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <StatusCard
        eyebrow="Loading result"
        title="Checking candidate result access"
        body="The system is validating this session and checking whether a candidate-facing summary is available."
      />
    );
  }

  if (errorMessage) {
    return (
      <StatusCard
        eyebrow="Access restricted"
        title="This result summary cannot be opened"
        body={errorMessage}
        tone="error"
      />
    );
  }

  if (!summary || summary.visibility !== 'summary') {
   const hiddenCopy = getHiddenCopy(summary?.reason, summary?.audience);

    return (
      <StatusCard
        eyebrow="Result visibility"
        title={hiddenCopy.title}
        body={hiddenCopy.body}
      />
    );
  }

  return (
    <CandidateResultSummary
      overallBand={summary.overallBand ?? 'Not available'}
      abstractReasoningBand={summary.abstractReasoningBand ?? 'Not available'}
      numericalReasoningBand={summary.numericalReasoningBand ?? 'Not available'}
      audience={summary.audience ?? 'employer-invited'}
    />
  );
};