'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  AssessmentApiError,
  exchangeCandidateResultAccessToken,
  storeSessionAccessToken,
} from '../api/assessment-api';

type CandidateResultAccessLoaderProps = {
  token: string;
};

const getAccessErrorMessage = (error: unknown) => {
  if (error instanceof AssessmentApiError) {
    if (error.status === 401) {
      return 'This result link could not be validated because the result-access endpoint is being treated as a protected route.';
    }

    if (error.status === 400) {
      return 'This result link is invalid, expired, already used, or no longer available.';
    }

    if (error.status === 403) {
      return 'Candidate-facing results are not currently available for this assessment. The employer or assessment administrator may have changed the result visibility setting.';
    }

    if (error.status === 404) {
      return 'This result link could not be found.';
    }
  }

  return error instanceof Error
    ? error.message
    : 'The result link could not be opened.';
};

export const CandidateResultAccessLoader = ({
  token,
}: CandidateResultAccessLoaderProps) => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const exchangeToken = async () => {
      try {
        const result = await exchangeCandidateResultAccessToken(
          token,
          controller.signal
        );

        storeSessionAccessToken(result.sessionId, result.sessionAccessToken);

        router.replace(
          `/assessment/session/${encodeURIComponent(result.sessionId)}/report`
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(getAccessErrorMessage(error));
      }
    };

    void exchangeToken();

    return () => {
      controller.abort();
    };
  }, [router, token]);

  if (errorMessage) {
    return (
      <section className="rounded-[1.75rem] border border-red-300/20 bg-red-400/10 p-5 shadow-2xl shadow-black/30 sm:rounded-[2rem] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-red-200">
          Result link unavailable
        </p>

        <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
          This result summary cannot be opened
        </h1>

        <p className="mt-5 max-w-3xl text-sm leading-7 text-red-100 sm:text-base">
          {errorMessage}
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/[0.07]"
          >
            Go home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-cyan-300/15 bg-[#07142f]/95 p-5 shadow-2xl shadow-black/30 sm:rounded-[2rem] sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
        Result access
      </p>

      <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
        Opening your result summary
      </h1>

      <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
        IQMeridian is validating your secure result link and preparing your
        candidate-facing summary.
      </p>
    </section>
  );
};
