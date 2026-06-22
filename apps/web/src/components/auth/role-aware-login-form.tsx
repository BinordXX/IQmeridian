'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

import {
  getDefaultDashboardForRole,
  isAppRole,
  resolvePostLoginRedirect,
  type AppRole,
} from '@/lib/role-routing';

type SessionResponse = {
  user?: {
    role?: string;
  };
};

type RoleAwareLoginFormProps = {
  title: string;
  eyebrow: string;
  description: string;
  submitLabel?: string;
  callbackUrl?: string | null;
  allowedRoles?: AppRole[];
  nonMatchingRoleMessage?: string;
};

export function RoleAwareLoginForm({
  title,
  eyebrow,
  description,
  submitLabel = 'Sign in',
  callbackUrl,
  allowedRoles,
  nonMatchingRoleMessage,
}: RoleAwareLoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedRoleSet = useMemo(() => {
    return new Set(allowedRoles ?? []);
  }, [allowedRoles]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setErrorMessage('Invalid email or password.');
        return;
      }

      const sessionResponse = await fetch('/api/auth/session', {
        cache: 'no-store',
      });

      const session = (await sessionResponse.json()) as SessionResponse;
      const role = session.user?.role;

      if (!isAppRole(role)) {
        setErrorMessage('Login succeeded, but no valid role was returned.');
        return;
      }

      if (allowedRoles && !allowedRoleSet.has(role)) {
        if (nonMatchingRoleMessage) {
          setErrorMessage(nonMatchingRoleMessage);
        }

        router.replace(getDefaultDashboardForRole(role));
        router.refresh();
        return;
      }

      router.replace(
        resolvePostLoginRedirect({
          role,
          callbackUrl,
        })
      );
      router.refresh();
    } catch {
      setErrorMessage('Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {eyebrow}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in...' : submitLabel}
          </button>
        </form>
      </section>
    </main>
  );
}
