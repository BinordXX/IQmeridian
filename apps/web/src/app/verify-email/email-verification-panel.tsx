'use client';

import { CheckCircle2, Mail, RefreshCw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

type VerificationState = 'idle' | 'verifying' | 'verified' | 'failed';

type EmailVerificationPanelProps = {
  initialEmail: string;
  token: string;
};

const getErrorMessage = (payload: {
  message?: string | string[];
  error?: string;
}) => {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }

  return (
    payload.message ?? payload.error ?? 'The request could not be completed.'
  );
};

export function EmailVerificationPanel({
  initialEmail,
  token,
}: EmailVerificationPanelProps) {
  const [email, setEmail] = useState(initialEmail);
  const [verificationState, setVerificationState] = useState<VerificationState>(
    token ? 'verifying' : 'idle'
  );
  const [message, setMessage] = useState<string | null>(
    token
      ? 'Verifying your email address...'
      : 'Check your inbox for the verification email. You can request a new link below if needed.'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    const verifyEmail = async () => {
      setVerificationState('verifying');
      setErrorMessage(null);
      setMessage('Verifying your email address...');

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          message?: string | string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(getErrorMessage(payload));
        }

        setVerificationState('verified');
        setMessage('Email verified successfully. You can now sign in.');
      } catch (error) {
        setVerificationState('failed');
        setErrorMessage(
          error instanceof Error ? error.message : 'Email verification failed.'
        );
        setMessage(null);
      }
    };

    void verifyEmail();
  }, [token]);

  const resendVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalisedEmail = email.trim().toLowerCase();

    if (!normalisedEmail) {
      setErrorMessage('Enter the email address you registered with.');
      return;
    }

    setIsResending(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/resend-email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalisedEmail,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string | string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      setMessage(
        'If this email still needs verification, a new verification email has been sent.'
      );
      setVerificationState('idle');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Verification email could not be resent.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const icon =
    verificationState === 'verified' ? (
      <CheckCircle2 size={26} strokeWidth={2.3} />
    ) : verificationState === 'failed' ? (
      <XCircle size={26} strokeWidth={2.3} />
    ) : verificationState === 'verifying' ? (
      <RefreshCw className="animate-spin" size={26} strokeWidth={2.3} />
    ) : (
      <Mail size={26} strokeWidth={2.3} />
    );

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
      />

      <div className="relative space-y-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Email verification
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            Verify your IQMeridian account.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            New accounts must verify email ownership before sign-in is allowed.
          </p>
        </div>

        {message ? (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-100">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
            {errorMessage}
          </div>
        ) : null}

        {verificationState === 'verified' ? (
          <Link
            className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
            href="/login"
          >
            Continue to sign in
          </Link>
        ) : (
          <form
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
            onSubmit={resendVerification}
          >
            <label
              className="text-sm font-black text-slate-300"
              htmlFor="verification-email"
            >
              Registered email
            </label>

            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                className="w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
                id="verification-email"
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />

              <button
                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
                disabled={isResending}
                type="submit"
              >
                {isResending ? 'Sending...' : 'Resend verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
