'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type EmployerInvitationControlsProps = {
  invitationId: string;
  token: string;
  status: string;
  hasSession?: boolean;
};

type ActionState = {
  tone: 'success' | 'error';
  message: string;
};

const readActionResponse = async (response: Response) => {
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed with status ${response.status}`);
  }

  return payload;
};

export function EmployerInvitationControls({
  invitationId,
  token,
  status,
  hasSession = false,
}: EmployerInvitationControlsProps) {
  const router = useRouter();

  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [extendDays, setExtendDays] = useState('7');

  const invitationUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return `/assessment/invitation/${encodeURIComponent(token)}/instructions`;
    }

    return `${window.location.origin}/assessment/invitation/${encodeURIComponent(
      token,
    )}/instructions`;
  }, [token]);

  const canModify =
    !hasSession && (status === 'PENDING' || status === 'ACCEPTED' || status === 'EXPIRED');

  const canResend = !hasSession && (status === 'PENDING' || status === 'ACCEPTED');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl);

      setActionState({
        tone: 'success',
        message: 'Invitation link copied.',
      });
    } catch {
      setActionState({
        tone: 'error',
        message: 'Unable to copy link. Select and copy it manually.',
      });
    }
  };

  const resendInvitation = async () => {
    if (!canResend || isWorking) return;

    setIsWorking(true);
    setActionState(null);

    try {
      await readActionResponse(
        await fetch(`/api/employer/invitations/${encodeURIComponent(invitationId)}/resend`, {
          method: 'POST',
        }),
      );

      await navigator.clipboard.writeText(invitationUrl).catch(() => undefined);

      setActionState({
        tone: 'success',
        message:
          'Resend action recorded. Email delivery is not wired yet, so the link has been copied for manual sending.',
      });

      router.refresh();
    } catch (error) {
      setActionState({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Invitation could not be resent.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const cancelInvitation = async () => {
    if (!canModify || isWorking) return;

    const confirmed = window.confirm(
      'Cancel this invitation? The candidate will no longer be able to claim it.',
    );

    if (!confirmed) return;

    setIsWorking(true);
    setActionState(null);

    try {
      await readActionResponse(
        await fetch(`/api/employer/invitations/${encodeURIComponent(invitationId)}/cancel`, {
          method: 'PATCH',
        }),
      );

      setActionState({
        tone: 'success',
        message: 'Invitation cancelled.',
      });

      router.refresh();
    } catch (error) {
      setActionState({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Invitation could not be cancelled.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const extendInvitation = async () => {
    if (!canModify || isWorking) return;

    const days = Number(extendDays);

    if (!Number.isFinite(days) || days <= 0) {
      setActionState({
        tone: 'error',
        message: 'Choose a valid extension period.',
      });
      return;
    }

    setIsWorking(true);
    setActionState(null);

    try {
      const expiresAt = new Date(
        Date.now() + days * 24 * 60 * 60 * 1000,
      ).toISOString();

      await readActionResponse(
        await fetch(`/api/employer/invitations/${encodeURIComponent(invitationId)}/extend`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expiresAt }),
        }),
      );

      setActionState({
        tone: 'success',
        message: `Invitation extended by ${days} day${days === 1 ? '' : 's'}.`,
      });

      router.refresh();
    } catch (error) {
      setActionState({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Invitation could not be extended.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15"
          onClick={copyLink}
          type="button"
        >
          Copy link
        </button>

        <button
          className="rounded-xl border border-blue-300/20 bg-blue-400/10 px-3 py-2 text-xs font-black text-blue-100 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-500"
          disabled={!canResend || isWorking}
          onClick={resendInvitation}
          type="button"
        >
          Resend
        </button>

        <button
          className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-500"
          disabled={!canModify || isWorking}
          onClick={cancelInvitation}
          type="button"
        >
          Cancel
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-xl border border-white/10 bg-[#020817] px-3 py-2 text-xs font-black text-white outline-none"
          disabled={!canModify || isWorking}
          onChange={(event) => setExtendDays(event.currentTarget.value)}
          value={extendDays}
        >
          <option value="3">+3 days</option>
          <option value="7">+7 days</option>
          <option value="14">+14 days</option>
          <option value="30">+30 days</option>
        </select>

        <button
          className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-500"
          disabled={!canModify || isWorking}
          onClick={extendInvitation}
          type="button"
        >
          Extend
        </button>
      </div>

      <p className="break-all rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-slate-400">
        {invitationUrl}
      </p>

      {actionState ? (
        <p
          className={`rounded-xl border p-3 text-xs font-bold leading-5 ${
            actionState.tone === 'success'
              ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
              : 'border-red-300/20 bg-red-400/10 text-red-100'
          }`}
        >
          {actionState.message}
        </p>
      ) : null}
    </div>
  );
}