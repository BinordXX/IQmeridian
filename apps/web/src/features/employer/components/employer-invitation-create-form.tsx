'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { createEmployerInvitation } from '../api/employer-dashboard-api';

type EmployerInvitationCreateFormProps = {
  campaignId: string;
  campaignStatus: string;
};

export const EmployerInvitationCreateForm = ({
  campaignId,
  campaignStatus,
}: EmployerInvitationCreateFormProps) => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [candidateUserId, setCandidateUserId] = useState('dev-candidate-1');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canCreateInvitations = campaignStatus === 'ACTIVE';

  const submitInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || isCreating || !canCreateInvitations) {
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

      const invitation = await createEmployerInvitation({
        campaignId,
        email: email.trim(),
        candidateUserId: candidateUserId.trim() || undefined,
        expiresAt,
      });

      const invitationUrl = `${window.location.origin}/assessment/invitation/${encodeURIComponent(
        invitation.token
      )}/instructions`;

      setCreatedLink(invitationUrl);
      setEmail('');
      router.refresh();
    } catch {
      setErrorMessage(
        'The invitation could not be created. Confirm that the campaign is available and the candidate details are valid.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">
          Invite candidate
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Generate an invitation link for this campaign. At MVP stage this uses
          the existing development candidate identity unless a different
          candidate user ID is supplied.
        </p>
      </div>

      {!canCreateInvitations ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Invitations can only be created for active campaigns. Change this
          campaign&apos;s status to ACTIVE before inviting candidates.
        </div>
      ) : null}

      <form onSubmit={submitInvitation} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="candidate-email"
            className="text-sm font-medium text-slate-700"
          >
            Candidate email
          </label>

          <input
            id="candidate-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
            placeholder="candidate@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="candidate-user-id"
            className="text-sm font-medium text-slate-700"
          >
            Candidate user ID
          </label>

          <input
            id="candidate-user-id"
            type="text"
            value={candidateUserId}
            onChange={(event) => setCandidateUserId(event.currentTarget.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
            placeholder="dev-candidate-1"
          />

          <p className="mt-2 text-xs leading-5 text-slate-500">
            This remains a development-stage field until candidate account
            creation is formalised.
          </p>
        </div>

        <div>
          <label
            htmlFor="expires-in-days"
            className="text-sm font-medium text-slate-700"
          >
            Link validity
          </label>

          <select
            id="expires-in-days"
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(event.currentTarget.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
          >
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>

        {errorMessage ? (
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
        ) : null}

        {createdLink ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">
              Invitation link created
            </p>

            <p className="mt-2 break-all text-sm leading-6 text-emerald-800">
              {createdLink}
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!email.trim() || isCreating || !canCreateInvitations}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isCreating ? 'Creating invitation...' : 'Create invitation'}
        </button>
      </form>
    </section>
  );
};
