'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

type InvitationResult = {
  status?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
  };
  expiresAt?: string;
  emailDelivery?:
    | {
        status: 'SMTP_ACCEPTED' | 'CONSOLE' | 'SMTP_REJECTED';
        mode: 'smtp' | 'console';
        messageId: string | null;
        accepted: string[];
        rejected: string[];
      }
    | {
        status: 'FAILED';
        error: string;
      };
  message?: string;
  error?: string;
};

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

export default function PlatformAdminInvitationsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<InvitationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setResult(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setError('Enter the Platform Administrator name.');
      return;
    }

    if (!cleanEmail) {
      setError('Enter the Platform Administrator email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        '/api/internal/super/platform-admin-invitations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | InvitationResult
        | null;

      if (!response.ok) {
        throw new Error(
          getMessage(payload, 'Platform Admin invitation could not be sent.'),
        );
      }

      setResult(payload ?? {});
      setName('');
      setEmail('');
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Platform Admin invitation could not be sent.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/internal/admin/super"
          className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
        >
          ← Back to Super Admin
        </Link>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
            Super Admin control plane
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Invite Platform Administrator
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Create a restricted Platform Administrator account invitation. The
            recipient must accept the one-time invitation and establish their
            password before the account becomes active.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/10">
          <div className="mb-6">
            <h2 className="text-lg font-black text-white">
              New Platform Admin invitation
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Invitations expire after 24 hours and are intended only for the
              named recipient.
            </p>
          </div>

          <form className="space-y-5" onSubmit={submitInvitation}>
            <div>
              <label
                htmlFor="platform-admin-name"
                className="mb-2 block text-sm font-bold text-slate-200"
              >
                Full name
              </label>

              <input
                id="platform-admin-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSubmitting}
                autoComplete="name"
                placeholder="Platform Administrator name"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="platform-admin-email"
                className="mb-2 block text-sm font-bold text-slate-200"
              >
                Email address
              </label>

              <input
                id="platform-admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
                placeholder="admin@example.com"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">
                {error}
              </div>
            ) : null}

            {result?.user ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="font-bold text-emerald-200">
                  Platform Admin invitation created.
                </p>

                <div className="mt-3 space-y-1 text-sm leading-6 text-emerald-100/80">
                  <p>
                    <span className="font-semibold">Name:</span>{' '}
                    {result.user.name ?? '—'}
                  </p>

                  <p>
                    <span className="font-semibold">Email:</span>{' '}
                    {result.user.email}
                  </p>

                  <p>
                    <span className="font-semibold">Account status:</span>{' '}
                    {result.user.status}
                  </p>

                  {result.expiresAt ? (
                    <p>
                      <span className="font-semibold">Expires:</span>{' '}
                      {new Date(result.expiresAt).toLocaleString()}
                    </p>
                  ) : null}

                  {result.emailDelivery ? (
                    <>
                      <p>
                        <span className="font-semibold">Email delivery:</span>{' '}
                        {result.emailDelivery.status}
                      </p>

                      {'accepted' in result.emailDelivery &&
                      result.emailDelivery.accepted.length > 0 ? (
                        <p>
                          <span className="font-semibold">SMTP accepted:</span>{' '}
                          {result.emailDelivery.accepted.join(', ')}
                        </p>
                      ) : null}

                      {'rejected' in result.emailDelivery &&
                      result.emailDelivery.rejected.length > 0 ? (
                        <p>
                          <span className="font-semibold">SMTP rejected:</span>{' '}
                          {result.emailDelivery.rejected.join(', ')}
                        </p>
                      ) : null}

                      {'messageId' in result.emailDelivery &&
                      result.emailDelivery.messageId ? (
                        <p className="break-all">
                          <span className="font-semibold">Message ID:</span>{' '}
                          {result.emailDelivery.messageId}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </div>

                {result.emailDelivery?.status === 'CONSOLE' ? (
                  <p className="mt-4 text-xs leading-5 text-emerald-100/70">
                    Development email delivery is in console mode. Copy the
                    invitation URL from the API terminal.
                  </p>
                ) : null}

                {result.emailDelivery?.status === 'SMTP_ACCEPTED' ? (
                  <p className="mt-4 text-xs leading-5 text-emerald-100/70">
                    The SMTP server accepted the message for delivery. This
                    confirms SMTP handoff, not final inbox delivery.
                  </p>
                ) : null}

                {result.emailDelivery?.status === 'SMTP_REJECTED' ? (
                  <p className="mt-4 text-xs leading-5 text-red-200">
                    The SMTP server did not accept the invitation for delivery.
                    Review the SMTP configuration before retrying.
                  </p>
                ) : null}

                {result.emailDelivery?.status === 'FAILED' ? (
                  <p className="mt-4 text-xs leading-5 text-amber-200">
                    The account invitation was created, but email delivery
                    failed: {result.emailDelivery.error}
                  </p>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Creating invitation...'
                : 'Send Platform Admin invitation'}
            </button>
          </form>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Authorization boundary
          </p>

          <h2 className="mt-3 text-lg font-black text-white">
            Platform Admin ≠ Super Admin
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            This workflow creates the PLATFORM_ADMIN role. It does not grant
            SUPER_ADMIN privileges or access to the Super Admin control plane.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
            The invitation remains unusable for authentication until the
            recipient creates a password and successfully claims the one-time
            token.
          </div>
        </aside>
      </div>
    </div>
  );
}