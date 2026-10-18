'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

type PlatformAdminInvitation = {
  email: string;
  name: string | null;
  role: string;
  status: string;
  expiresAt: string;
};

type PlatformAdminInvitationAcceptanceProps = {
  token: string;
};

type LoadState = 'loading' | 'ready' | 'error' | 'accepted';

function getMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === 'string') {
    return record.message;
  }

  if (Array.isArray(record.message)) {
    const messages = record.message.filter(
      (entry): entry is string => typeof entry === 'string',
    );

    if (messages.length) {
      return messages.join(' ');
    }
  }

  if (typeof record.error === 'string') {
    return record.error;
  }

  return fallback;
}

export function PlatformAdminInvitationAcceptance({
  token,
}: PlatformAdminInvitationAcceptanceProps) {
  const [invitation, setInvitation] =
    useState<PlatformAdminInvitation | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadInvitation = async () => {
      try {
        const response = await fetch(
          `/api/platform-admin-invitations/${encodeURIComponent(token)}`,
          {
            cache: 'no-store',
            signal: controller.signal,
          },
        );

        const payload = (await response.json().catch(() => null)) as unknown;

        if (!response.ok) {
          throw new Error(
            getMessage(payload, 'This invitation could not be loaded.'),
          );
        }

        setInvitation(payload as PlatformAdminInvitation);
        setLoadState('ready');
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : 'This invitation could not be loaded.',
        );
        setLoadState('error');
      }
    };

    void loadInvitation();

    return () => {
      controller.abort();
    };
  }, [token]);

  const submitAcceptance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmissionError(null);

    if (password.length < 12) {
      setSubmissionError('Password must contain at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmissionError('Password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/platform-admin-invitations/${encodeURIComponent(token)}/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password,
            confirmPassword,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(
          getMessage(payload, 'The invitation could not be accepted.'),
        );
      }

      setPassword('');
      setConfirmPassword('');
      setLoadState('accepted');
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'The invitation could not be accepted.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadState === 'loading') {
    return (
      <InvitationShell>
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8">
          <p className="text-sm text-slate-400">
            Validating Platform Admin invitation...
          </p>
        </div>
      </InvitationShell>
    );
  }

  if (loadState === 'error') {
    return (
      <InvitationShell>
        <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">
            Invitation unavailable
          </p>

          <h1 className="mt-3 text-2xl font-black text-white">
            This invitation cannot be used.
          </h1>

          <p className="mt-4 text-sm leading-7 text-red-100/80">
            {loadError ?? 'The invitation is invalid, expired, or unavailable.'}
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full border border-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/5"
          >
            Go to sign in
          </Link>
        </div>
      </InvitationShell>
    );
  }

  if (loadState === 'accepted') {
    return (
      <InvitationShell>
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Account activated
          </p>

          <h1 className="mt-3 text-2xl font-black text-white">
            Platform Admin invitation accepted.
          </h1>

          <p className="mt-4 text-sm leading-7 text-emerald-100/80">
            Your email has been verified and your Platform Administrator
            account is now active. Sign in using the invited email address and
            the password you just created.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-6 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/15"
          >
            Sign in to IQMeridian
          </Link>
        </div>
      </InvitationShell>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <InvitationShell>
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
          IQMeridian administration
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          Platform Admin invitation
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-400">
          You have been authorized to create a Platform Administrator account.
          Establish your password below to activate access.
        </p>

        <div className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Name
            </p>
            <p className="mt-1 font-semibold text-slate-200">
              {invitation.name ?? '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Email
            </p>
            <p className="mt-1 font-semibold text-slate-200">
              {invitation.email}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Role
            </p>
            <p className="mt-1 font-semibold text-slate-200">
              {invitation.role}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Invitation expires
            </p>
            <p className="mt-1 font-semibold text-slate-200">
              {new Date(invitation.expiresAt).toLocaleString()}
            </p>
          </div>
        </div>

        <form className="mt-7 space-y-5" onSubmit={submitAcceptance}>
          <div>
            <label
              htmlFor="platform-admin-password"
              className="mb-2 block text-sm font-bold text-slate-200"
            >
              Create password
            </label>

            <input
              id="platform-admin-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              placeholder="Minimum 12 characters"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="platform-admin-confirm-password"
              className="mb-2 block text-sm font-bold text-slate-200"
            >
              Confirm password
            </label>

            <input
              id="platform-admin-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isSubmitting}
              placeholder="Repeat password"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-60"
            />
          </div>

          {submissionError ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">
              {submissionError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Activating account...'
              : 'Accept invitation and activate account'}
          </button>
        </form>
      </div>
    </InvitationShell>
  );
}

function InvitationShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-lg font-black tracking-tight text-white"
        >
          IQMeridian
        </Link>

        {children}

        <p className="mt-6 text-center text-xs leading-5 text-slate-600">
          Administrative access is role restricted and subject to IQMeridian
          authorization controls.
        </p>
      </div>
    </main>
  );
}