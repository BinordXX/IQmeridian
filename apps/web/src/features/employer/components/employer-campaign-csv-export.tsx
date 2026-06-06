'use client';

import type {
  EmployerInvitationSummary,
  EmployerSessionSummary,
} from '../api/employer-dashboard-api';

type EmployerCampaignCsvExportProps = {
  campaignName: string;
  invitations: EmployerInvitationSummary[];
  sessions: EmployerSessionSummary[];
};

const escapeCsvValue = (value: string | number | null | undefined): string => {
  const safeValue = value === undefined || value === null ? '' : String(value);

  if (
    safeValue.includes(',') ||
    safeValue.includes('"') ||
    safeValue.includes('\n')
  ) {
    return `"${safeValue.replaceAll('"', '""')}"`;
  }

  return safeValue;
};

export const EmployerCampaignCsvExport = ({
  campaignName,
  invitations,
  sessions,
}: EmployerCampaignCsvExportProps) => {
  const completedSessions = sessions.filter((session) => {
    return session.status === 'COMPLETED';
  });

  const canExport = completedSessions.length > 0;

  const exportCsv = () => {
    if (!canExport) {
      return;
    }

    const rows = invitations.map((invitation) => {
      const session = sessions.find((entry) => {
        return entry.invitationId === invitation.id;
      });

      return [
        invitation.email,
        invitation.status,
        session?.status ?? 'NO_SESSION',
        session?.completedAt ?? '',
        session?.score?.overallBand ?? '',
        session?.score?.abstractBand ?? '',
        session?.score?.numericalBand ?? '',
      ];
    });

    const csv = [
      [
        'Candidate',
        'Invitation status',
        'Session status',
        'Completed at',
        'Overall band',
        'Abstract band',
        'Numerical band',
      ],
      ...rows,
    ]
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${campaignName
      .toLowerCase()
      .replaceAll(' ', '-')}-candidate-summary.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <button
        type="button"
        onClick={exportCsv}
        disabled={!canExport}
        className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Export CSV summary
      </button>

      {!canExport ? (
        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
          CSV export becomes available after at least one candidate has
          completed the assessment.
        </p>
      ) : null}
    </div>
  );
};
