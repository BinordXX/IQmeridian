'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

type EmployerInvitationCreateFormProps = {
  campaignId: string;
  campaignStatus: string;
};

type CreatedInvitation = {
  token: string;
};

const createInvitation = async (input: {
  campaignId: string;
  email: string;
  expiresAt?: string;
}) => {
  const response = await fetch('/api/employer/invitations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    token?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message ?? 'Invitation could not be created.');
  }

  if (!payload.token) {
    throw new Error('Invitation was created without a token.');
  }

  return payload as CreatedInvitation;
};

export const EmployerInvitationCreateForm = ({
  campaignId,
  campaignStatus,
}: EmployerInvitationCreateFormProps) => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canCreateInvitations = campaignStatus === 'ACTIVE';

  const submitInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalisedEmail = email.trim().toLowerCase();

    if (!normalisedEmail || isCreating || !canCreateInvitations) {
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);
    setCreatedLink(null);

    try {
      const days = Number(expiresInDays);
      const expiresAt = Number.isFinite(days)
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const invitation = await createInvitation({
        campaignId,
        email: normalisedEmail,
        expiresAt,
      });

      const invitationUrl = `${window.location.origin}/assessment/invitation/${encodeURIComponent(
        invitation.token,
      )}/instructions`;

      setCreatedLink(invitationUrl);
      setEmail('');
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The invitation could not be created.',
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
          Candidate invitation
        </p>

        <h3 className="mt-2 text-xl font-black text-white">
          Invite candidate
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Enter the candidate&apos;s email address. The candidate account will
          be linked automatically when the candidate registers or signs in with
          the same email.
        </p>
      </div>

      {!canCreateInvitations ? (
        <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          Invitations can only be created for active campaigns. Change this
          campaign&apos;s status to ACTIVE before inviting candidates.
        </div>
      ) : null}

      <form onSubmit={submitInvitation} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="candidate-email"
            className="text-sm font-bold text-slate-300"
          >
            Candidate email
          </label>

          <input
            id="candidate-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
            placeholder="candidate@example.com"
            required
          />

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Do not enter a database user ID. IQMeridian will bind the invitation
            to the candidate account during registration or sign-in.
          </p>
        </div>

        <div>
          <label
            htmlFor="expires-in-days"
            className="text-sm font-bold text-slate-300"
          >
            Link validity
          </label>

          <select
            id="expires-in-days"
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
          >
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
            {errorMessage}
          </div>
        ) : null}

        {createdLink ? (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
            <p className="text-sm font-black text-emerald-100">
              Invitation link created
            </p>

            <p className="mt-2 break-all text-sm leading-6 text-emerald-100/80">
              {createdLink}
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!email.trim() || isCreating || !canCreateInvitations}
          className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-500"
        >
          {isCreating ? 'Creating invitation...' : 'Create invitation'}
        </button>
      </form>
    </section>
  );
};