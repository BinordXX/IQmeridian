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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
        </div>

        <span
          className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
            tone,
          ].join(' ')}
        >
          <Icon size={20} strokeWidth={2} />
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
};

const CampaignRow = ({ campaign }: { campaign: EmployerCampaignSummary }) => {
  const invitationCount = campaign.invitations?.length ?? 0;

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-4">
        <p className="font-medium text-slate-950">{campaign.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {campaign.assessmentForm?.name ?? 'No assessment form shown'}
        </p>
      </td>
      <td className="px-4 py-4 text-sm text-slate-700">{campaign.status}</td>
      <td className="px-4 py-4 text-sm text-slate-700">{invitationCount}</td>
    </tr>
  );
};

const SessionRow = ({ session }: { session: EmployerSessionSummary }) => {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-4">
        <p className="font-medium text-slate-950">
          {session.user?.name ?? session.candidateName ?? session.userId}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {session.user?.email ?? session.invitationId ?? 'Candidate session'}
        </p>
      </td>
      <td className="px-4 py-4 text-sm text-slate-700">{session.status}</td>
      <td className="px-4 py-4 text-sm text-slate-700">
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
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Employer dashboard
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Workspace overview
        </h2>

        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Monitor active assessment campaigns, invitation activity, candidate
          progress, and completion state from one controlled employer workspace.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Active campaigns"
          value={data.metrics.activeCampaigns}
          helper="Campaigns currently open"
          icon={BriefcaseBusiness}
          tone="border-blue-100 bg-blue-50 text-blue-700"
        />
        <MetricCard
          label="Total campaigns"
          value={data.metrics.totalCampaigns}
          helper="All employer campaigns"
          icon={ClipboardList}
          tone="border-violet-100 bg-violet-50 text-violet-700"
        />
        <MetricCard
          label="Invitations"
          value={data.metrics.totalInvitations}
          helper="Known campaign invitations"
          icon={Send}
          tone="border-emerald-100 bg-emerald-50 text-emerald-700"
        />
        <MetricCard
          label="Started sessions"
          value={data.metrics.startedSessions}
          helper="Candidates who entered testing"
          icon={UsersRound}
          tone="border-amber-100 bg-amber-50 text-amber-700"
        />
        <MetricCard
          label="Completion rate"
          value={`${data.metrics.completionRate}%`}
          helper="Completed out of started"
          icon={BarChart3}
          tone="border-indigo-100 bg-indigo-50 text-indigo-700"
        />
        <MetricCard
          label="Report-ready results"
          value={data.metrics.reportReadyResults}
          helper="Sessions with available scores"
          icon={FileText}
          tone="border-rose-100 bg-rose-50 text-rose-700"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-lg font-semibold text-slate-950">Campaigns</h3>
            <p className="mt-1 text-sm text-slate-600">
              Active and recent assessment campaigns.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-slate-500">
                  <th className="px-4 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Invitations</th>
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

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-lg font-semibold text-slate-950">
              Recent candidate activity
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Latest assessment session states.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-slate-500">
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
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
                      No candidate sessions are available yet.
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
