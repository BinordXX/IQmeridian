import Link from 'next/link';

import type {
  EmployerCampaignDetail as EmployerCampaignDetailData,
  EmployerInvitationSummary,
} from '../api/employer-dashboard-api';
import { EmployerInvitationControls } from './employer-invitation-controls';
import { EmployerResultVisibilityControl } from './employer-result-visibility-control';
import { EmployerCampaignCsvExport } from './employer-campaign-csv-export';
import { EmployerCampaignResultOverview } from './employer-campaign-result-overview';
import { EmployerCampaignSummaryCards } from './employer-campaign-summary-cards';
import { EmployerCandidateComparisonTable } from './employer-candidate-comparison-table';
import { EmployerCandidateStatusTable } from './employer-candidate-status-table';
import { EmployerInvitationCreateForm } from './employer-invitation-create-form';
import { EmployerCampaignPdfExport } from './employer-campaign-pdf-export';

type EmployerCampaignDetailProps = {
  campaign: EmployerCampaignDetailData;
};

const getInvitationDisplayStatus = (
  invitation: EmployerInvitationSummary,
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

  return invitation.status;
};

export const EmployerCampaignDetail = ({
  campaign,
}: EmployerCampaignDetailProps) => {
  const invitations: EmployerInvitationSummary[] = campaign.invitations ?? [];
  const sessions = campaign.sessions ?? [];
  const hasCompletedSessions = sessions.some((session) => {
    return session.status === 'COMPLETED';
  });

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Campaign workspace
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
              {campaign.name}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
              Manage invitations, monitor participant progress, and access
              campaign outcomes from a single employer workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/employer/campaigns/${encodeURIComponent(campaign.id)}/edit`}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
            >
              Edit status
            </Link>

            <Link
              href="/employer/campaigns"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/[0.07]"
            >
              Back to campaigns
            </Link>
          </div>
        </div>
      </section>

      <EmployerCampaignSummaryCards
        invitations={invitations}
        sessions={sessions}
      />

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Campaign exports</h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Campaign-level exports provide structured summaries for employer
              review. CSV exports download the candidate result table, while PDF
              export uses the browser print workflow for the current campaign
              view.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <EmployerCampaignCsvExport
              campaignName={campaign.name}
              invitations={invitations}
              sessions={sessions}
            />

            <EmployerCampaignPdfExport canExport={hasCompletedSessions} />
          </div>
        </div>
      </section>

      <EmployerResultVisibilityControl campaignStatus={campaign.status} />

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <h3 className="text-lg font-black text-white">
              Campaign metadata
            </h3>

            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm font-bold text-slate-500">
                  Assessment form
                </dt>
                <dd className="mt-1 text-sm font-black text-slate-200">
                  {campaign.assessmentForm?.name ??
                    campaign.assessmentFormId ??
                    'No assessment form assigned'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-bold text-slate-500">
                  Organisation
                </dt>
                <dd className="mt-1 text-sm font-black text-slate-200">
                  {campaign.organisation?.name ?? 'Employer organisation'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-bold text-slate-500">Owner</dt>
                <dd className="mt-1 text-sm font-black text-slate-200">
                  {campaign.owner?.email ?? campaign.owner?.name ?? 'Owner'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-bold text-slate-500">
                  Campaign ID
                </dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-400">
                  {campaign.id}
                </dd>
              </div>
            </dl>
          </section>

          <EmployerCampaignResultOverview sessions={sessions} />

          <EmployerCandidateComparisonTable
            campaignId={campaign.id}
            sessions={sessions}
          />

          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/88 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="text-lg font-black text-white">
                Invitation status
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Track candidate invitation links and their operational state.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Controls</th>
                  </tr>
                </thead>

                <tbody>
                  {invitations.length > 0 ? (
                    invitations.map((invitation) => (
                      <tr
                        key={invitation.id}
                        className="border-b border-white/10 align-top last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <p className="font-black text-white">
                            {invitation.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {invitation.candidateUserId
                              ? 'Candidate account linked'
                              : 'Awaiting candidate account claim'}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
                            {getInvitationDisplayStatus(invitation)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-400">
                          {invitation.expiresAt
                            ? new Date(invitation.expiresAt).toLocaleString()
                            : 'No expiry shown'}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          <EmployerInvitationControls
                            invitationId={invitation.id}
                            token={invitation.token}
                            status={getInvitationDisplayStatus(invitation)}
                            hasSession={sessions.some((session) => {
                              return session.invitationId === invitation.id;
                            })}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No invitations have been created for this campaign.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <EmployerCandidateStatusTable
            campaignId={campaign.id}
            invitations={invitations}
            sessions={sessions}
          />
        </div>

        <EmployerInvitationCreateForm
          campaignId={campaign.id}
          campaignStatus={campaign.status}
        />
      </section>

      <section className="rounded-[2rem] border border-amber-300/15 bg-amber-400/10 p-6">
        <h3 className="text-lg font-black text-white">
          Interpretation guidance
        </h3>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-amber-100/80">
          These results provide structured evidence from this assessment only.
          They should not be treated as a final hiring decision, a diagnosis, or
          a complete measure of candidate capability. The bands are intended to
          support review within this campaign and should be considered alongside
          interviews, role-relevant work evidence, experience, and consistent
          selection criteria.
        </p>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-amber-100/80">
          Differences between candidates should be interpreted cautiously,
          especially where completion conditions, accessibility needs, or
          contextual factors may have shaped performance. The platform supports
          decision-making; it does not replace employer judgement.
        </p>
      </section>
    </div>
  );
};