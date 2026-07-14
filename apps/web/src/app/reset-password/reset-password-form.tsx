'use client';

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

type ResetPasswordResponse = {
  status?: string;
  message?: string | string[];
  error?: string;
};

type ResetPasswordFormProps = {
  token: string;
};

const getErrorMessage = (payload: ResetPasswordResponse) => {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }

  return payload.message ?? payload.error ?? 'Password reset failed.';
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordIsLongEnough = password.length >= 12;
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || isComplete) {
      return;
    }

    if (!token) {
      setErrorMessage('Password reset token is missing.');
      return;
    }

    if (!passwordIsLongEnough) {
      setErrorMessage('Password must be at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as ResetPasswordResponse;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      setIsComplete(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Password reset failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-100">
          <CheckCircle2 size={26} strokeWidth={2.3} />
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-white">
          Password reset complete.
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-100/80">
          Your password has been updated. Any active sessions were revoked. Sign
          in again with your new password.
        </p>

        <Link
          className="mt-6 inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
          href="/login"
        >
          Continue to sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
      />

      <form className="relative space-y-6" onSubmit={submitReset}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
          <LockKeyhole size={26} strokeWidth={2.3} />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Secure reset
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            Choose a new password.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            Enter a new password for your IQMeridian account. Reset links expire
            quickly and can only be used once.
          </p>
        </div>

        {!token ? (
          <div className="flex gap-3 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            <span>
              This reset link is missing its token. Request a new password reset
              email.
            </span>
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm font-black text-slate-300">
            New password
          </span>

          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 transition focus-within:border-cyan-300/40">
            <input
              autoComplete="new-password"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              disabled={isSubmitting || !token}
              minLength={12}
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder="At least 12 characters"
              type={showPassword ? 'text' : 'password'}
              value={password}
            />

            <button
              className="text-slate-500 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !token}
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? (
                <EyeOff size={18} strokeWidth={2.2} />
              ) : (
                <Eye size={18} strokeWidth={2.2} />
              )}
            </button>
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-300">
            Confirm new password
          </span>

          <input
            autoComplete="new-password"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            disabled={isSubmitting || !token}
            minLength={12}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            placeholder="Repeat new password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
          />
        </label>

        <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-5 text-slate-400">
          <p
            className={
              passwordIsLongEnough ? 'font-semibold text-cyan-200' : undefined
            }
          >
            Password must be at least 12 characters.
          </p>
          <p
            className={
              passwordsMatch ? 'font-semibold text-cyan-200' : undefined
            }
          >
            Password confirmation must match.
          </p>
        </div>

        {errorMessage ? (
          <div className="flex gap-3 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
          disabled={isSubmitting || !token}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={17} />
              Resetting password
            </>
          ) : (
            <>
              Reset password
              <ArrowRight size={17} strokeWidth={2.4} />
            </>
          )}
        </button>

        <p className="text-sm text-slate-400">
          Need a new reset link?{' '}
          <Link
            className="font-black text-cyan-300 transition hover:text-cyan-200"
            href="/forgot-password"
          >
            Request another email
          </Link>
          .
        </p>
      </form>
    </section>
  );
}
