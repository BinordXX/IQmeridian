'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { EmployerParticipantSummary } from '../api/employer-participants-api';

type ParticipantStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

type EmployerParticipantsTableProps = {
  participants: EmployerParticipantSummary[];
};

type ActionState = {
  participantId: string;
  tone: 'success' | 'error';
  message: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const readActionResponse = async (response: Response) => {
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
    error?: string;
  };

  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(' ')
      : payload.message;

    throw new Error(
      message ?? payload.error ?? `Request failed with status ${response.status}`,
    );
  }

  return payload;
};

export function EmployerParticipantsTable({
  participants,
}: EmployerParticipantsTableProps) {
  const router = useRouter();

  const [isWorkingId, setIsWorkingId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState | null>(null);

  const metrics = useMemo(() => {
    return {
      total: participants.length,
      active: participants.filter((participant) => {
        return participant.status === 'ACTIVE';
      }).length,
      inactive: participants.filter((participant) => {
        return participant.status === 'INACTIVE';
      }).length,
      archived: participants.filter((participant) => {
        return participant.status === 'ARCHIVED';
      }).length,
    };
  }, [participants]);

  const updateStatus = async (
    participant: EmployerParticipantSummary,
    status: ParticipantStatus,
  ) => {
    if (isWorkingId) return;

    if (
      status === 'ARCHIVED' &&
      !window.confirm(
        'Archive this participant? Existing historical records remain available, but this participant will be removed from the active register.',
      )
    ) {
      return;
    }

    setIsWorkingId(participant.id);
    setActionState(null);

    try {
      await readActionResponse(
        await fetch(
          `/api/employer/participants/${encodeURIComponent(participant.id)}/status`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
          },
        ),
      );

      setActionState({
        participantId: participant.id,
        tone: 'success',
        message: `Participant status updated to ${status}.`,
      });

      router.refresh();
    } catch (error) {
      setActionState({
        participantId: participant.id,
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Participant status could not be updated.',
      });
    } finally {
      setIsWorkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/88 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Total
          </p>
          <p className="mt-2 text-3xl font-black text-white">{metrics.total}</p>
        </div>

        <div className="rounded-[1.5rem] border border-emerald-300/15 bg-[#07142f]/88 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
            Active
          </p>
          <p className="mt-2 text-3xl font-black text-white">{metrics.active}</p>
        </div>

        <div className="rounded-[1.5rem] border border-amber-300/15 bg-[#07142f]/88 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
            Inactive
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {metrics.inactive}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-300/15 bg-[#07142f]/88 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">
            Archived
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {metrics.archived}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/88 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">
            Organisation participants
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Participants are linked to candidate users through invitations and
            assessment sessions. This register supports future reassessment,
            archiving, and managed-profile workflows.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead>
              <tr className="border-b border-white/10 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">Organisation</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Controls</th>
              </tr>
            </thead>

            <tbody>
              {participants.length > 0 ? (
                participants.map((participant) => {
                  const invitationCount = participant._count?.invitations ?? 0;
                  const sessionCount = participant._count?.sessions ?? 0;
                  const isWorking = isWorkingId === participant.id;
                  const participantActionState =
                    actionState?.participantId === participant.id
                      ? actionState
                      : null;

                  return (
                    <tr
                      className="border-b border-white/10 align-top last:border-b-0"
                      key={participant.id}
                    >
                      <td className="px-4 py-4">
                        <p className="font-black text-white">
                          {participant.user?.name ??
                            participant.user?.email ??
                            'Unnamed participant'}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {participant.user?.email ?? 'No email'}
                        </p>
                        <p className="mt-2 break-all font-mono text-xs text-slate-600">
                          {participant.id}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-200">
                          {participant.organisation?.name ?? 'Organisation'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {participant.department ?? 'No department recorded'}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
                          {participant.accessMode}
                        </span>
                        <p className="mt-2 text-xs text-slate-500">
                          {participant.participantType}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-200">
                          {invitationCount} invitation
                          {invitationCount === 1 ? '' : 's'}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {sessionCount} session
                          {sessionCount === 1 ? '' : 's'}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-400">
                        {formatDate(participant.createdAt)}
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-slate-200">
                          {participant.status}
                        </span>
                        {participant.archivedAt ? (
                          <p className="mt-2 text-xs text-slate-500">
                            Archived {formatDate(participant.archivedAt)}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
                            disabled={
                              isWorking || participant.status === 'ACTIVE'
                            }
                            onClick={() => updateStatus(participant, 'ACTIVE')}
                            type="button"
                          >
                            Activate
                          </button>

                          <button
                            className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs font-black text-amber-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
                            disabled={
                              isWorking || participant.status === 'INACTIVE'
                            }
                            onClick={() =>
                              updateStatus(participant, 'INACTIVE')
                            }
                            type="button"
                          >
                            Inactive
                          </button>

                          <button
                            className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-black text-red-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
                            disabled={
                              isWorking || participant.status === 'ARCHIVED'
                            }
                            onClick={() =>
                              updateStatus(participant, 'ARCHIVED')
                            }
                            type="button"
                          >
                            Archive
                          </button>
                        </div>

                        {participantActionState ? (
                          <p
                            className={`mt-3 rounded-xl border p-3 text-xs font-bold leading-5 ${
                              participantActionState.tone === 'success'
                                ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                                : 'border-red-300/20 bg-red-400/10 text-red-100'
                            }`}
                          >
                            {participantActionState.message}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-sm text-slate-500"
                    colSpan={7}
                  >
                    No organisation participants have been linked yet. Invite a
                    candidate and have them claim the invitation to populate this
                    register.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}