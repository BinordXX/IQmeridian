import Link from 'next/link';

import type {
  EmployerCampaignSummary,
  EmployerSessionSummary,
} from '../api/employer-dashboard-api';

type EmployerCampaignListProps = {
  campaigns: EmployerCampaignSummary[];
  sessions: EmployerSessionSummary[];
};

const getCampaignSessions = (
  campaignId: string,
  sessions: EmployerSessionSummary[]
): EmployerSessionSummary[] => {
  return sessions.filter((session) => session.campaignId === campaignId);
};

const getCampaignProgress = (
  campaignId: string,
  sessions: EmployerSessionSummary[]
): {
  started: number;
  completed: number;
  completionRate: number;
} => {
  const campaignSessions = getCampaignSessions(campaignId, sessions);

  const started = campaignSessions.filter((session) => {
    return session.status !== 'NOT_STARTED';
  }).length;

  const completed = campaignSessions.filter((session) => {
    return session.status === 'COMPLETED';
  }).length;

  return {
    started,
    completed,
    completionRate: started > 0 ? Math.round((completed / started) * 100) : 0,
  };
};

export const EmployerCampaignList = ({
  campaigns,
  sessions,
}: EmployerCampaignListProps) => {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Campaign management
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-950">Campaigns</h2>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            View all assessment campaigns associated with this employer
            workspace. The list shows campaign status, assessment form,
            candidate activity, and completion progress.
          </p>
        </div>

        <Link
          href="/employer/campaigns/new"
          className="inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Create campaign
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-950">
            Employer campaigns
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Campaigns are listed with operational progress rather than detailed
            psychometric results.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Assessment form</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Candidates</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => {
                  const invitationCount = campaign.invitations?.length ?? 0;
                  const progress = getCampaignProgress(campaign.id, sessions);

                  return (
                    <tr key={campaign.id} className="border-t border-slate-100">
                      <td className="px-4 py-4 align-top">
                        <p className="font-medium text-slate-950">
                          {campaign.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {campaign.id}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        {campaign.assessmentForm?.name ??
                          campaign.assessmentFormId ??
                          'No assessment form assigned'}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {campaign.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        <p>{invitationCount} invited</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {progress.started} started
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        <p>
                          {progress.completed} completed / {progress.started}{' '}
                          started
                        </p>
                        <div className="mt-2 h-2 w-36 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-slate-950"
                            style={{
                              width: `${progress.completionRate}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {progress.completionRate}% completion
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top text-sm">
                        <Link
                          href={`/employer/campaigns/${encodeURIComponent(
                            campaign.id
                          )}/edit`}
                          className="font-semibold text-slate-950 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No campaigns are available for this employer workspace.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
