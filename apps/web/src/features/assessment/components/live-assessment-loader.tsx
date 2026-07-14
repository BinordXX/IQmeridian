'use client';

import { useEffect, useState } from 'react';

import { resumeAssessmentSession } from '../api/assessment-api';
import type { AssessmentSessionPayload } from '../contracts/assessment-contracts';
import { LiveAssessmentShell } from './live-assessment-shell';

type LiveAssessmentLoaderProps = {
  sessionId: string;
};

export function LiveAssessmentLoader({ sessionId }: LiveAssessmentLoaderProps) {
  const [session, setSession] = useState<AssessmentSessionPayload | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      setStatus('loading');
      setMessage(null);

      try {
        const payload = await resumeAssessmentSession(sessionId);

        if (!isMounted) {
          return;
        }

        setSession(payload);
        setStatus('ready');
      } catch {
        if (!isMounted) {
          return;
        }

        setSession(null);
        setStatus('error');
        setMessage(
          'This assessment session could not be opened. Reopen the original invitation link in the same browser, or ask the employer to resend the invitation.'
        );
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <section className="w-full max-w-xl rounded-3xl border border-cyan-300/15 bg-[#07142f] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            IQMeridian Assessment
          </p>
          <h1 className="mt-4 text-2xl font-black text-white">
            Preparing your assessment
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Please wait while we restore your secure assessment session.
          </p>
        </section>
      </main>
    );
  }

  if (status === 'error' || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <section className="w-full max-w-xl rounded-3xl border border-red-300/20 bg-[#07142f] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
            Assessment access issue
          </p>
          <h1 className="mt-4 text-2xl font-black text-white">
            Session could not be opened
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
        </section>
      </main>
    );
  }

  return <LiveAssessmentShell session={session} />;
}
