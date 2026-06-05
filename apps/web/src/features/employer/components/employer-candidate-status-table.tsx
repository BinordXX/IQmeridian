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
  invitation: EmployerInvitationSummary
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
  sessions: EmployerSessionSummary[]
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
          searchValue
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
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-950">
          Candidate status
        </h3>

        <p className="mt-1 text-sm text-slate-600">
          Track candidate invitation state, assessment progress, completion, and
          result availability.
        </p>
      </div>

      <div className="grid gap-3 border-b border-slate-100 px-5 py-4 md:grid-cols-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          placeholder="Search candidate"
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
        />

        <select
          value={invitationStatusFilter}
          onChange={(event) =>
            setInvitationStatusFilter(event.currentTarget.value)
          }
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
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
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
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
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
        >
          <option value="ALL">All result states</option>
          <option value="AVAILABLE">Result available</option>
          <option value="MISSING">Result not available</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-slate-500">
              <th className="px-4 py-3 font-medium">Candidate</th>
              <th className="px-4 py-3 font-medium">Invitation</th>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Completion</th>
              <th className="px-4 py-3 font-medium">Overall band</th>
              <th className="px-4 py-3 font-medium">Completed</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-950">
                      {row.candidateIdentifier}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.invitation.email}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top text-sm text-slate-700">
                    {row.invitationStatus}
                  </td>

                  <td className="px-4 py-4 align-top text-sm text-slate-700">
                    {row.sessionStatus}
                  </td>

                  <td className="px-4 py-4 align-top text-sm text-slate-700">
                    {row.completionState}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      {row.overallBand}
                    </span>
                  </td>

                  <td className="px-4 py-4 align-top text-sm text-slate-700">
                    {row.completedAt
                      ? new Date(row.completedAt).toLocaleString()
                      : 'Not completed'}
                  </td>

                  <td className="px-4 py-4 align-top text-sm">
                    <Link
                      href={`/employer/campaigns/${encodeURIComponent(
                        campaignId
                      )}/candidates/${encodeURIComponent(row.id)}`}
                      className="font-semibold text-slate-950 hover:underline"
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
