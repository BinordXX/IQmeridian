import type {
  EmployerInvitationSummary,
  EmployerSessionSummary,
} from '../api/employer-dashboard-api';

type EmployerCampaignSummaryCardsProps = {
  invitations: EmployerInvitationSummary[];
  sessions: EmployerSessionSummary[];
};

const SummaryCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
};

export const EmployerCampaignSummaryCards = ({
  invitations,
  sessions,
}: EmployerCampaignSummaryCardsProps) => {
  const started = sessions.filter((session) => {
    return session.status !== 'NOT_STARTED';
  }).length;

  const completed = sessions.filter((session) => {
    return session.status === 'COMPLETED';
  }).length;

  const reportReady = sessions.filter((session) => {
    return Boolean(session.score);
  }).length;

  const completionRate =
    started > 0 ? Math.round((completed / started) * 100) : 0;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        label="Invited candidates"
        value={invitations.length}
        helper="Total invitations issued"
      />

      <SummaryCard
        label="Started"
        value={started}
        helper="Candidates who entered testing"
      />

      <SummaryCard
        label="Completed"
        value={completed}
        helper="Candidates who submitted"
      />

      <SummaryCard
        label="Completion rate"
        value={`${completionRate}%`}
        helper="Completed out of started"
      />

      <SummaryCard
        label="Report-ready"
        value={reportReady}
        helper="Scored sessions available"
      />
    </section>
  );
};
