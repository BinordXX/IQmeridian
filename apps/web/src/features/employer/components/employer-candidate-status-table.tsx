'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type {
  EmployerInvitationSummary,
  EmployerSessionSummary,
} from '../api/employer-dashboard-api';

type EmployerCandidateStatusTableProps = {
  campaignId: string;
  invitations: EmployerInvitationSummary[];
  sessions: EmployerSessionSummary[];
};

type CandidateRow = {
  id: string;
  candidateIdentifier: string;
  invitationStatus: string;
  sessionStatus: string;
  completionState: string;
  overallBand: string;
  completedAt?: string | null;
  invitation: EmployerInvitationSummary;
  session?: EmployerSessionSummary;
};

const getInvitationDisplayStatus = (
  invitation: EmployerInvitationSummary,
): string => {
  if (invitation.status !== 'PENDING') {
    return invitation.status;
  }

  if (invitation.usedAt) {
    return 'ACCEPTED';
  }

  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    return 'EXPIRED';
  }

  return 'PENDING';
};

const getCompletionState = (session?: EmployerSessionSummary): string => {
  if (!session) {
    return 'Not started';
  }

  if (session.status === 'COMPLETED') {
    return 'Completed';
  }

  if (session.status === 'IN_PROGRESS') {
    return 'In progress';
  }

  if (session.status === 'EXPIRED') {
    return 'Expired';
  }

  if (session.status === 'ABANDONED') {
    return 'Abandoned';
  }

  return 'Not started';
};

const normaliseSearchValue = (value: string): string => {
  return value.trim().toLowerCase();
};

const buildCandidateRows = (
  invitations: EmployerInvitationSummary[],
  sessions: EmployerSessionSummary[],
): CandidateRow[] => {
  return invitations.map((invitation) => {
    const session = sessions.find((entry) => {
      return entry.invitationId === invitation.id;
    });

    const candidateIdentifier =
      session?.user?.name ??
      session?.user?.email ??
      invitation.email ??
      invitation.candidateUserId ??
      invitation.id;

    return {
      id: session?.id ?? invitation.id,
      candidateIdentifier,
      invitationStatus: getInvitationDisplayStatus(invitation),
      sessionStatus: session?.status ?? 'NO_SESSION',
      completionState: getCompletionState(session),
      overallBand: session?.score?.overallBand ?? 'Not available',
      completedAt: session?.completedAt,
      invitation,
      session,
    };
  });
};

export const EmployerCandidateStatusTable = ({
  campaignId,
  invitations,
  sessions,
}: EmployerCandidateStatusTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [invitationStatusFilter, setInvitationStatusFilter] = useState('ALL');
  const [completionFilter, setCompletionFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');

  const rows = useMemo(() => {
    return buildCandidateRows(invitations, sessions);
  }, [invitations, sessions]);

  const filteredRows = useMemo(() => {
    const searchValue = normaliseSearchValue(searchQuery);

    return rows.filter((row) => {
      const matchesSearch =
        !searchValue ||
        normaliseSearchValue(row.candidateIdentifier).includes(searchValue) ||
        normaliseSearchValue(row.invitation.email).includes(searchValue) ||
        normaliseSearchValue(row.invitation.candidateUserId ?? '').includes(
          searchValue,
        );

      const matchesInvitationStatus =
        invitationStatusFilter === 'ALL' ||
        row.invitationStatus === invitationStatusFilter;

      const matchesCompletion =
        completionFilter === 'ALL' || row.completionState === completionFilter;

      const hasResult = row.overallBand !== 'Not available';

      const matchesResult =
        resultFilter === 'ALL' ||
        (resultFilter === 'AVAILABLE' && hasResult) ||
        (resultFilter === 'MISSING' && !hasResult);

      return (
        matchesSearch &&
        matchesInvitationStatus &&
        matchesCompletion &&
        matchesResult
      );
    });
  }, [
    completionFilter,
    invitationStatusFilter,
    resultFilter,
    rows,
    searchQuery,
  ]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/88 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/10 px-5 py-4">
        <h3 className="text-lg font-black text-white">Candidate status</h3>

        <p className="mt-1 text-sm leading-6 text-slate-400">
          Track candidate invitation state, assessment progress, completion, and
          result availability.
        </p>
      </div>

      <div className="grid gap-3 border-b border-white/10 px-5 py-4 md:grid-cols-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          placeholder="Search candidate"
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
        />

        <select
          value={invitationStatusFilter}
          onChange={(event) =>
            setInvitationStatusFilter(event.currentTarget.value)
          }
          className="rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
        >
          <option value="ALL">All invitation statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={completionFilter}
          onChange={(event) => setCompletionFilter(event.currentTarget.value)}
          className="rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
        >
          <option value="ALL">All completion states</option>
          <option value="Not started">Not started</option>
          <option value="In progress">In progress</option>
          <option value="Completed">Completed</option>
          <option value="Expired">Expired</option>
          <option value="Abandoned">Abandoned</option>
        </select>

        <select
          value={resultFilter}
          onChange={(event) => setResultFilter(event.currentTarget.value)}
          className="rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
        >
          <option value="ALL">All result states</option>
          <option value="AVAILABLE">Result available</option>
          <option value="MISSING">Result not available</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Invitation</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Completion</th>
              <th className="px-4 py-3">Overall band</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/10 align-top last:border-b-0"
                >
                  <td className="px-4 py-4">
                    <p className="font-black text-white">
                      {row.candidateIdentifier}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.invitation.email}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-sm font-bold text-slate-300">
                    {row.invitationStatus}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-400">
                    {row.sessionStatus}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-400">
                    {row.completionState}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
                      {row.overallBand}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-400">
                    {row.completedAt
                      ? new Date(row.completedAt).toLocaleString()
                      : 'Not completed'}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <Link
                      href={`/employer/campaigns/${encodeURIComponent(
                        campaignId,
                      )}/candidates/${encodeURIComponent(row.id)}`}
                      className="font-black text-cyan-100 hover:underline"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No candidates match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};