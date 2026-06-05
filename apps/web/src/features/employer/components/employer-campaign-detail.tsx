import Link from 'next/link';

import type {
  EmployerCampaignDetail as EmployerCampaignDetailData,
  EmployerInvitationSummary,
} from '../api/employer-dashboard-api';
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
  invitation: EmployerInvitationSummary
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

const getInvitationAssessmentUrl = (token: string): string => {
  return `/assessment/invitation/${encodeURIComponent(token)}/instructions`;
};

export const EmployerCampaignDetail = ({
  campaign,
}: EmployerCampaignDetailProps) => {
  const invitations: EmployerInvitationSummary[] = campaign.invitations ?? [];
  const sessions = campaign.sessions ?? [];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Campaign workspace
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-950">
            {campaign.name}
          </h2>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Manage invitations, monitor candidate progress, and access campaign
            outcomes from a single employer workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/employer/campaigns/${encodeURIComponent(campaign.id)}/edit`}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Edit status
          </Link>

          <Link
            href="/employer/campaigns"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to campaigns
          </Link>
        </div>
      </section>

      <EmployerCampaignSummaryCards
        invitations={invitations}
        sessions={sessions}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Campaign exports
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
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

            <EmployerCampaignPdfExport />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Campaign metadata
            </h3>

            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">
                  Assessment form
                </dt>
                <dd className="mt-1 text-sm text-slate-950">
                  {campaign.assessmentForm?.name ??
                    campaign.assessmentFormId ??
                    'No assessment form assigned'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-slate-500">
                  Organisation
                </dt>
                <dd className="mt-1 text-sm text-slate-950">
                  {campaign.organisation?.name ?? 'Employer organisation'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-slate-500">Owner</dt>
                <dd className="mt-1 text-sm text-slate-950">
                  {campaign.owner?.email ?? campaign.owner?.name ?? 'Owner'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-slate-500">
                  Campaign ID
                </dt>
                <dd className="mt-1 break-all text-sm text-slate-950">
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

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-950">
                Invitation status
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Track candidate invitation links and their operational state.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-slate-500">
                    <th className="px-4 py-3 font-medium">Candidate</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Link</th>
                  </tr>
                </thead>

                <tbody>
                  {invitations.length > 0 ? (
                    invitations.map((invitation) => (
                      <tr
                        key={invitation.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-4 align-top">
                          <p className="font-medium text-slate-950">
                            {invitation.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {invitation.candidateUserId ?? 'No candidate user'}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                            {getInvitationDisplayStatus(invitation)}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                          {invitation.expiresAt
                            ? new Date(invitation.expiresAt).toLocaleString()
                            : 'No expiry shown'}
                        </td>

                        <td className="px-4 py-4 align-top text-sm">
                          <Link
                            href={getInvitationAssessmentUrl(invitation.token)}
                            className="font-semibold text-slate-950 hover:underline"
                          >
                            Open link
                          </Link>
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

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-lg font-semibold text-slate-950">
          Interpretation guidance
        </h3>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          These results provide structured evidence from this assessment only.
          They should not be treated as a final hiring decision, a diagnosis, or
          a complete measure of candidate capability. The bands are intended to
          support review within this campaign and should be considered alongside
          interviews, role-relevant work evidence, experience, and consistent
          selection criteria.
        </p>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          Differences between candidates should be interpreted cautiously,
          especially where completion conditions, accessibility needs, or
          contextual factors may have shaped performance. The platform supports
          decision-making; it does not replace employer judgement.
        </p>
      </section>
    </div>
  );
};
