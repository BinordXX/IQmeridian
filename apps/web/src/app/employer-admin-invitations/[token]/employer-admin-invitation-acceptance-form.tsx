'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

type EmployerAdminInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organisation: {
    id: string;
    name: string;
  };
};

type EmployerAdminInvitationAcceptanceFormProps = {
  invitation: EmployerAdminInvitation;
  token: string;
};

const getErrorMessage = (payload: {
  message?: string | string[];
  error?: string;
}) => {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }

  return payload.message ?? payload.error ?? 'The invitation could not be accepted.';
};

export function EmployerAdminInvitationAcceptanceForm({
  invitation,
  token,
}: EmployerAdminInvitationAcceptanceFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualLoginMessage, setManualLoginMessage] = useState<string | null>(
    null,
  );

  const submitAcceptance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (password.length < 12) {
      setErrorMessage('Password must be at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setManualLoginMessage(null);

    try {
      const response = await fetch(
        `/api/employer-admin-invitations/${encodeURIComponent(token)}/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim() || undefined,
            password,
            confirmPassword,
          }),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string | string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      const signInResult = await signIn('credentials', {
        email: invitation.email,
        password,
        redirect: false,
      });

      if (!signInResult?.ok) {
        setManualLoginMessage(
          'Invitation accepted and employer-admin account created. Sign in manually using the invited email and password.',
        );
        return;
      }

      router.replace('/auth/redirect');
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The invitation could not be accepted.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
      onSubmit={submitAcceptance}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
      />

      <div className="relative space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Employer-admin invitation
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
            Create your employer-admin account.
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            This invitation will attach your account to the approved employer
            organisation and grant employer-admin workspace access.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Organisation
            </p>
            <p className="mt-2 text-sm font-black text-white">
              {invitation.organisation.name}
            </p>
            <p className="mt-1 break-all font-mono text-xs text-slate-600">
              {invitation.organisation.id}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Invited email
            </p>
            <p className="mt-2 break-all text-sm font-black text-white">
              {invitation.email}
            </p>
            <p className="mt-1 text-xs font-bold text-cyan-300">
              Role: {invitation.role}
            </p>
          </div>
        </div>

        <div>
          <label
            className="text-sm font-black text-slate-300"
            htmlFor="employer-admin-name"
          >
            Name
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            id="employer-admin-name"
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="Your full name"
            value={name}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              className="text-sm font-black text-slate-300"
              htmlFor="employer-admin-password"
            >
              Password
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              id="employer-admin-password"
              minLength={12}
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder="At least 12 characters"
              type="password"
              value={password}
              required
            />
          </div>

          <div>
            <label
              className="text-sm font-black text-slate-300"
              htmlFor="employer-admin-confirm-password"
            >
              Confirm password
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              id="employer-admin-confirm-password"
              minLength={12}
              onChange={(event) =>
                setConfirmPassword(event.currentTarget.value)
              }
              placeholder="Repeat password"
              type="password"
              value={confirmPassword}
              required
            />
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
            {errorMessage}
          </div>
        ) : null}

        {manualLoginMessage ? (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-100">
            {manualLoginMessage}
          </div>
        ) : null}

        <button
          className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Accepting invitation...' : 'Accept invitation'}
        </button>
      </div>
    </form>
  );
}