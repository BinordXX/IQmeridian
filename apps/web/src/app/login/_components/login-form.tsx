'use client';

import { GoogleAuthPlaceholder } from '../../_components/google-auth-placeholder';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type LoginFormProps = {
  callbackUrl: string;
};

function getReadableLoginError(errorCode?: string) {
  if (!errorCode) {
    return 'The email or password is incorrect, or this account is not active.';
  }

  if (errorCode === 'CredentialsSignin') {
    return 'The email or password is incorrect.';
  }

  if (errorCode === 'AccessDenied') {
    return 'Access was denied for this account.';
  }

  if (errorCode === 'Configuration') {
    return 'Authentication is not configured correctly. Check the web and API auth environment values.';
  }

  return 'Sign-in failed. Confirm your details and try again.';
}

function getSafeResultUrl(
  resultUrl: string | null | undefined,
  fallback: string
) {
  if (!resultUrl) {
    return fallback;
  }

  try {
    const parsedUrl = new URL(resultUrl, window.location.origin);

    if (parsedUrl.origin !== window.location.origin) {
      return fallback;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return fallback;
  }
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = status === 'submitting';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    const normalisedEmail = email.trim().toLowerCase();

    if (!normalisedEmail || !password) {
      setError('Enter your email address and password.');
      return;
    }

    setStatus('submitting');

    try {
      const result = await signIn('credentials', {
        callbackUrl,
        email: normalisedEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        setStatus('idle');
        setError(getReadableLoginError(result.error));
        return;
      }

      const nextUrl = getSafeResultUrl(result?.url, callbackUrl);

      router.push(nextUrl);
      router.refresh();
    } catch {
      setStatus('idle');
      setError('Unable to reach the authentication service. Try again.');
    }
  }

  return (
    <div className="rounded-[2.25rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(3,7,18,0.96))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
          Account login
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
          Continue to your workspace.
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Use the email and password connected to your IQMeridian account.
        </p>
      </div>

      <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Email</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-cyan-300/50">
            <Mail className="text-slate-500" size={18} strokeWidth={2.2} />
            <input
              autoComplete="email"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Password</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-cyan-300/50">
            <LockKeyhole
              className="text-slate-500"
              size={18}
              strokeWidth={2.2}
            />
            <input
              autoComplete="current-password"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              className="text-slate-500 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
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

        <div aria-live="polite">
          {error ? (
            <div className="flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              <span>{error}</span>
            </div>
          ) : null}

          {isSubmitting ? (
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-cyan-100">
              Verifying credentials and preparing your workspace.
            </div>
          ) : null}
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3 text-sm font-black text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_12px_40px_rgba(34,211,238,0.18)] transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={17} />
              Signing in
            </>
          ) : (
            <>
              Sign in
              <ArrowRight size={17} strokeWidth={2.4} />
            </>
          )}
        </button>
        <Link
          className="text-sm font-black text-cyan-300 transition hover:text-cyan-200"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <p className="text-sm text-slate-400">
          Do not have an account?{' '}
          <Link
            className="font-black text-cyan-300 transition hover:text-cyan-200"
            href="/register"
          >
            Create one
          </Link>
          .
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <GoogleAuthPlaceholder />
      </div>
    </div>
  );
}
