'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as {
        message?: string | string[];
      } | null;

      const message = Array.isArray(error?.message)
        ? error?.message.join(' ')
        : error?.message;

      setErrorMessage(message ?? 'Registration failed.');
      setIsSubmitting(false);
      return;
    }

    const signInResult = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!signInResult?.ok) {
      router.push('/login');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          IQMeridian
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">
          Create account
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Public registration creates a consumer account. Candidate, researcher,
          employer-admin, and platform-admin access must be assigned through the
          governed platform flow.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="text-sm font-medium text-slate-700"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
            <p className="mt-1 text-xs text-slate-500">
              Minimum 12 characters with uppercase, lowercase, number, and
              symbol.
            </p>
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-slate-950">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
