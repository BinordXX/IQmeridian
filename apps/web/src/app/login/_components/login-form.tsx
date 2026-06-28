'use client';

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

    if (!email.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }

    setStatus('submitting');

    const result = await signIn('credentials', {
      callbackUrl,
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setStatus('idle');
      setError('The email or password is incorrect, or this account is not active.');
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
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
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
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
              autoComplete="current-password"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              className="text-slate-500 transition hover:text-cyan-300"
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

        {error ? (
          <div className="flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            <span>{error}</span>
          </div>
        ) : null}

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
<button
  className="inline-flex cursor-not-allowed items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-400"
  disabled
  type="button"
>
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 48 48"
  >
    <path
      d="M44.5 20H24v8.5h11.8C34.7 34.1 30 37.5 24 37.5c-7.4 0-13.5-6.1-13.5-13.5S16.6 10.5 24 10.5c3.2 0 6.2 1.1 8.5 3.1l6-6C34.7 4.2 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.4-.2-2.7-.5-4Z"
      fill="#FFC107"
    />
    <path
      d="M4.5 14.1 11.5 19.2C13.4 14.1 18.3 10.5 24 10.5c3.2 0 6.2 1.1 8.5 3.1l6-6C34.7 4.2 29.6 2 24 2 15.5 2 8.2 6.8 4.5 14.1Z"
      fill="#FF3D00"
    />
    <path
      d="M24 46c5.5 0 10.5-2.1 14.2-5.6l-6.6-5.6c-2.1 1.6-4.8 2.7-7.6 2.7-5.9 0-10.9-3.8-12.7-9.1l-7 5.4C7.9 41 15.4 46 24 46Z"
      fill="#4CAF50"
    />
    <path
      d="M44.5 20H24v8.5h11.8c-.5 2.5-2 4.7-4.2 6.3l6.6 5.6C42 36.8 45 31.5 45 24c0-1.4-.2-2.7-.5-4Z"
      fill="#1976D2"
    />
  </svg>
  Continue with Google — coming soon
</button>
      </div>
    </div>
  );
}