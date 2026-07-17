'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type OrganisationAccessRequestResendInvitationButtonProps = {
  requestId: string;
  invitationStatus: string | null;
};

const getErrorMessage = (payload: {
  message?: string | string[];
  error?: string;
}) => {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }

  return (
    payload.message ??
    payload.error ??
    'The invitation email could not be resent.'
  );
};

export function OrganisationAccessRequestResendInvitationButton({
  requestId,
  invitationStatus,
}: OrganisationAccessRequestResendInvitationButtonProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canResend = invitationStatus === 'PENDING';

  const resendInvitation = async () => {
    if (!canResend || isSending) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/internal/organisation-access-requests/${encodeURIComponent(
          requestId
        )}/resend-admin-invitation`,
        {
          method: 'POST',
        }
      );

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string | string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The invitation email could not be resent.'
      );
    } finally {
      setIsSending(false);
    }
  };

  if (!canResend) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
        disabled={isSending}
        onClick={resendInvitation}
        type="button"
      >
        {isSending ? 'Sending...' : 'Resend invitation email'}
      </button>

      {errorMessage ? (
        <p className="mt-3 rounded-2xl border border-red-300/20 bg-red-400/10 p-3 text-xs font-bold leading-6 text-red-100">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
