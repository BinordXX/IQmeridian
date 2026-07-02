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
    <div className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/88 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{helper}</p>
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