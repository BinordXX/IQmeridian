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
  const exportCsv = () => {
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
    <button
      type="button"
      onClick={exportCsv}
      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
    >
      Export CSV summary
    </button>
  );
};
