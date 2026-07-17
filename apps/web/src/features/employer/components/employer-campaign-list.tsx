import Link from 'next/link';

import type {
  EmployerCampaignSummary,
  EmployerSessionSummary,
} from '../api/employer-dashboard-api';

type EmployerCampaignListItem = EmployerCampaignSummary & {
  sessions?: EmployerSessionSummary[];
};

type EmployerCampaignListProps = {
  campaigns: EmployerCampaignListItem[];
};

const getInvitationCount = (campaign: EmployerCampaignListItem) => {
  return campaign.invitations?.length ?? 0;
};

const getStartedSessionCount = (campaign: EmployerCampaignListItem) => {
  return (
    campaign.sessions?.filter((session) => {
      return session.status !== 'NOT_STARTED';
    }).length ?? 0
  );
};

const getCompletedSessionCount = (campaign: EmployerCampaignListItem) => {
  return (
    campaign.sessions?.filter((session) => {
      return session.status === 'COMPLETED';
    }).length ?? 0
  );
};

const getCompletionRate = (campaign: EmployerCampaignListItem) => {
  const started = getStartedSessionCount(campaign);
  const completed = getCompletedSessionCount(campaign);

  if (started === 0) {
    return 0;
  }

  return Math.round((completed / started) * 100);
};

export function EmployerCampaignList({ campaigns }: EmployerCampaignListProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/88 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-black text-white">Employer campaigns</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Campaigns are listed with operational progress rather than detailed
          psychometric results.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Assessment form</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Candidates</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => {
                const invited = getInvitationCount(campaign);
                const started = getStartedSessionCount(campaign);
                const completed = getCompletedSessionCount(campaign);
                const completionRate = getCompletionRate(campaign);

                return (
                  <tr
                    className="border-b border-white/10 align-top last:border-b-0"
                    key={campaign.id}
                  >
                    <td className="px-4 py-4">
                      <p className="font-black text-white">{campaign.name}</p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-600">
                        {campaign.id}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-200">
                        {campaign.assessmentForm?.name ??
                          'No assessment form shown'}
                      </p>
                      {campaign.assessmentForm?.version ? (
                        <p className="mt-1 text-xs text-slate-500">
                          v{campaign.assessmentForm.version}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
                        {campaign.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-200">
                        {invited} invited
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {started} started
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-200">
                        {completed} completed / {started} started
                      </p>
                      <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-cyan-300/70"
                          style={{
                            width: `${completionRate}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {completionRate}% completion
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        className="inline-flex rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15"
                        href={`/employer/campaigns/${encodeURIComponent(
                          campaign.id
                        )}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="px-4 py-12 text-center text-sm text-slate-500"
                  colSpan={6}
                >
                  No campaigns are available for this employer workspace.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
