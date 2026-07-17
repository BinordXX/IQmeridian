'use client';

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

type ForgotPasswordResponse = {
  status?: string;
  message?: string | string[];
  error?: string;
};

const getErrorMessage = (payload: ForgotPasswordResponse) => {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }

  return (
    payload.message ??
    payload.error ??
    'The password reset request could not be completed.'
  );
};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalisedEmail = email.trim().toLowerCase();

    if (!normalisedEmail) {
      setErrorMessage('Enter the email address linked to your account.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalisedEmail,
        }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as ForgotPasswordResponse;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      setSuccessMessage(
        'If an eligible account exists for this email, a password reset link has been sent.'
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The password reset request could not be completed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
      />

      <form className="relative space-y-6" onSubmit={submitRequest}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
          <Mail size={26} strokeWidth={2.3} />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Password recovery
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            Reset your IQMeridian password.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            Enter your account email. If the account is eligible, IQMeridian
            will send a secure reset link to that address.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-black text-slate-300">
            Account email
          </span>

          <input
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </label>

        {successMessage ? (
          <div className="flex gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-100">
            <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
            <span>{successMessage}</span>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="flex gap-3 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={17} />
              Sending reset link
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight size={17} strokeWidth={2.4} />
            </>
          )}
        </button>

        <p className="text-sm text-slate-400">
          Remembered your password?{' '}
          <Link
            className="font-black text-cyan-300 transition hover:text-cyan-200"
            href="/login"
          >
            Sign in
          </Link>
          .
        </p>
      </form>
    </section>
  );
}
