import type {
  EmployerCampaignSummary,
  EmployerDashboardData,
  EmployerSessionSummary,
} from '../api/employer-dashboard-api';

type EmployerDashboardOverviewProps = {
  data: EmployerDashboardData;
};

const MetricCard = ({
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Active campaigns"
          value={data.metrics.activeCampaigns}
          helper="Campaigns currently open"
        />
        <MetricCard
          label="Total campaigns"
          value={data.metrics.totalCampaigns}
          helper="All employer campaigns"
        />
        <MetricCard
          label="Invitations"
          value={data.metrics.totalInvitations}
          helper="Known campaign invitations"
        />
        <MetricCard
          label="Started sessions"
          value={data.metrics.startedSessions}
          helper="Candidates who entered testing"
        />
        <MetricCard
          label="Completion rate"
          value={`${data.metrics.completionRate}%`}
          helper="Completed out of started"
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
