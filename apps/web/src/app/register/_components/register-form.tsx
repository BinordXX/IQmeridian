'use client';

import { GoogleAuthPlaceholder } from '../../_components/google-auth-placeholder';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type RegisterResponse = {
  message?: string | string[];
};

function getReadableRegisterMessage(message: string | string[] | undefined) {
  if (Array.isArray(message)) {
    return message.join(' ');
  }

  if (!message) {
    return 'Account registration failed.';
  }

  if (message.toLowerCase().includes('already')) {
    return 'An account with this email already exists. Sign in instead.';
  }

  if (message.toLowerCase().includes('password')) {
    return message;
  }

  return message;
}

function getSafeResultUrl(resultUrl: string | null | undefined, fallback: string) {
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

export function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'registering' | 'signing-in' | 'success'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  const isBusy = status === 'registering' || status === 'signing-in';
  const passwordIsLongEnough = password.length >= 12;
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    setError(null);

    const normalisedEmail = email.trim().toLowerCase();

    if (!fullName.trim() || !normalisedEmail || !password || !confirmPassword) {
      setError('Complete all required fields.');
      return;
    }

    if (!passwordIsLongEnough) {
      setError('Password must be at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the platform terms before creating an account.');
      return;
    }

    setStatus('registering');

    try {
      const response = await fetch('/api/account/register', {
        body: JSON.stringify({
          email: normalisedEmail,
          name: fullName.trim(),
          password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      let payload: RegisterResponse = {};

      try {
        payload = (await response.json()) as RegisterResponse;
      } catch {
        payload = {};
      }

      if (!response.ok) {
        setStatus('idle');
        setError(getReadableRegisterMessage(payload.message));
        return;
      }

      setStatus('signing-in');

      const signInResult = await signIn('credentials', {
        callbackUrl: '/auth/redirect',
        email: normalisedEmail,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setStatus('success');
        router.push('/login');
        router.refresh();
        return;
      }

      const nextUrl = getSafeResultUrl(signInResult?.url, '/auth/redirect');

      router.push(nextUrl);
      router.refresh();
    } catch {
      setStatus('idle');
      setError('Unable to reach the registration service. Try again.');
    }
  }

  return (
    <div className="rounded-[2.25rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(3,7,18,0.96))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
          Account creation
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
          Start with a consumer account.
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Public registration creates an individual consumer account. Candidate
          invitation links, employer workspaces, researcher access, and platform
          admin roles are controlled separately.
        </p>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-400/10 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 shrink-0 text-cyan-300" size={18} />
          <div>
            <h3 className="text-sm font-black text-cyan-100">
              Registration clarity
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Use this page for standard consumer access. If you received an
              assessment invitation, use the invitation link. Employer,
              researcher, and admin accounts should not be self-created here.
            </p>
          </div>
        </div>
      </div>

      <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">
            Full name
          </span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-cyan-300/50">
            <UserRound className="text-slate-500" size={18} strokeWidth={2.2} />
            <input
              autoComplete="name"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
              type="text"
              value={fullName}
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Email</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-cyan-300/50">
            <Mail className="text-slate-500" size={18} strokeWidth={2.2} />
            <input
              autoComplete="email"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-300">
            Password
          </span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-cyan-300/50">
            <LockKeyhole
              className="text-slate-500"
              size={18}
              strokeWidth={2.2}
            />
            <input
              autoComplete="new-password"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 12 characters"
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              className="text-slate-500 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
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
          <span className="text-sm font-semibold text-slate-300">
            Confirm password
          </span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-cyan-300/50">
            <CheckCircle2
              className="text-slate-500"
              size={18}
              strokeWidth={2.2}
            />
            <input
              autoComplete="new-password"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
            />
          </span>
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

        <label className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
          <input
            checked={acceptedTerms}
            className="mt-1 h-4 w-4 accent-cyan-400 disabled:cursor-not-allowed"
            disabled={isBusy}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            type="checkbox"
          />
          <span>
            I understand that current IQMeridian score outputs are provisional
            and I agree to the{' '}
            <Link className="font-black text-cyan-300" href="/terms">
              Terms
            </Link>{' '}
            and{' '}
            <Link className="font-black text-cyan-300" href="/privacy">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <div aria-live="polite">
          {error ? (
            <div className="flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              <span>{error}</span>
            </div>
          ) : null}

          {status === 'registering' ? (
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-cyan-100">
              Creating your consumer account.
            </div>
          ) : null}

          {status === 'signing-in' ? (
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-cyan-100">
              Account created. Opening your dashboard.
            </div>
          ) : null}
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3 text-sm font-black text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_12px_40px_rgba(34,211,238,0.18)] transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          {status === 'registering' ? (
            <>
              <Loader2 className="animate-spin" size={17} />
              Creating account
            </>
          ) : status === 'signing-in' ? (
            <>
              <Loader2 className="animate-spin" size={17} />
              Opening dashboard
            </>
          ) : (
            <>
              Create consumer account
              <ArrowRight size={17} strokeWidth={2.4} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            className="font-black text-cyan-300 transition hover:text-cyan-200"
            href="/login"
          >
            Sign in
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