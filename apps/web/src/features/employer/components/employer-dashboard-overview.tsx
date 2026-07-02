import type {
  EmployerCampaignSummary,
  EmployerDashboardData,
  EmployerSessionSummary,
} from '../api/employer-dashboard-api';
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  LucideIcon,
  Send,
  UsersRound,
} from 'lucide-react';

type EmployerDashboardOverviewProps = {
  data: EmployerDashboardData;
};

const MetricCard = ({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  tone: string;
}) => {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/88 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
        </div>

        <span
          className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border',
            tone,
          ].join(' ')}
        >
          <Icon size={20} strokeWidth={2} />
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-400">{helper}</p>
    </div>
  );
};

const CampaignRow = ({ campaign }: { campaign: EmployerCampaignSummary }) => {
  const invitationCount = campaign.invitations?.length ?? 0;

  return (
    <tr className="border-t border-white/10">
      <td className="px-4 py-4">
        <p className="font-black text-white">{campaign.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {campaign.assessmentForm?.name ?? 'No assessment form shown'}
        </p>
      </td>
      <td className="px-4 py-4 text-sm font-bold text-slate-300">
        {campaign.status}
      </td>
      <td className="px-4 py-4 text-sm font-bold text-slate-300">
        {invitationCount}
      </td>
    </tr>
  );
};

const SessionRow = ({ session }: { session: EmployerSessionSummary }) => {
  return (
    <tr className="border-t border-white/10">
      <td className="px-4 py-4">
        <p className="font-black text-white">
          {session.user?.name ?? session.candidateName ?? session.userId}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {session.user?.email ?? session.invitationId ?? 'Candidate session'}
        </p>
      </td>
      <td className="px-4 py-4 text-sm font-bold text-slate-300">
        {session.status}
      </td>
      <td className="px-4 py-4 text-sm text-slate-400">
        {session.completedAt
          ? new Date(session.completedAt).toLocaleString()
          : 'Not completed'}
      </td>
    </tr>
  );
};

export const EmployerDashboardOverview = ({
  data,
}: EmployerDashboardOverviewProps) => {
  const recentSessions = data.sessions.slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Employer dashboard
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
            Workspace overview
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
            Monitor active assessment campaigns, invitation activity,
            participant progress, and completion state from one controlled
            employer workspace.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Active campaigns"
          value={data.metrics.activeCampaigns}
          helper="Campaigns currently open"
          icon={BriefcaseBusiness}
          tone="border-blue-300/20 bg-blue-400/10 text-blue-100"
        />
        <MetricCard
          label="Total campaigns"
          value={data.metrics.totalCampaigns}
          helper="All employer campaigns"
          icon={ClipboardList}
          tone="border-violet-300/20 bg-violet-400/10 text-violet-100"
        />
        <MetricCard
          label="Invitations"
          value={data.metrics.totalInvitations}
          helper="Known campaign invitations"
          icon={Send}
          tone="border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
        />
        <MetricCard
          label="Started sessions"
          value={data.metrics.startedSessions}
          helper="Participants who entered testing"
          icon={UsersRound}
          tone="border-amber-300/20 bg-amber-400/10 text-amber-100"
        />
        <MetricCard
          label="Completion rate"
          value={`${data.metrics.completionRate}%`}
          helper="Completed out of started"
          icon={BarChart3}
          tone="border-indigo-300/20 bg-indigo-400/10 text-indigo-100"
        />
        <MetricCard
          label="Report-ready results"
          value={data.metrics.reportReadyResults}
          helper="Sessions with available scores"
          icon={FileText}
          tone="border-rose-300/20 bg-rose-400/10 text-rose-100"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/88 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-lg font-black text-white">Campaigns</h3>
            <p className="mt-1 text-sm text-slate-400">
              Active and recent assessment campaigns.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Invitations</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.length > 0 ? (
                  data.campaigns.map((campaign) => (
                    <CampaignRow key={campaign.id} campaign={campaign} />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No campaigns are available for this employer workspace.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/88 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-lg font-black text-white">
              Recent participant activity
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Latest assessment session states.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Completed</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.length > 0 ? (
                  recentSessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No participant sessions are available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};