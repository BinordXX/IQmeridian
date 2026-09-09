import Link from 'next/link';
import { EmployerStatePanel } from './employer-state-panel';
import type {
  EmployerCampaignDetail,
  EmployerInvitationSummary,
  EmployerReportResult,
  EmployerSessionSummary,
} from '../api/employer-dashboard-api';
import { EmployerReportActions } from './employer-report-actions';
import { EmployerReportPrintButton } from './employer-report-print-button';

type EmployerCandidateReportProps = {
  campaign: EmployerCampaignDetail;
  invitation?: EmployerInvitationSummary;
  session: EmployerSessionSummary;
  report: EmployerReportResult | null;
};

const getCandidateIdentifier = (
  invitation: EmployerInvitationSummary | undefined,
  session: EmployerSessionSummary
): string => {
  return (
    session.applicantName ??
    session.applicantEmail ??
    invitation?.email ??
    session.invitation?.email ??
    session.user?.email ??
    session.user?.name ??
    session.userId ??
    session.id ??
    'Applicant'
  );
};

const getGeneratedAt = (report: EmployerReportResult | null): string => {
  const timestamp = report?.updatedAt ?? report?.createdAt;

  return timestamp ? new Date(timestamp).toLocaleString() : 'Not generated';
};

const MetricCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
};

export const EmployerCandidateReport = ({
  campaign,
  invitation,
  session,
  report,
}: EmployerCandidateReportProps) => {
  const score = session.score;
  const candidateIdentifier = getCandidateIdentifier(invitation, session);
  const canGenerateReport =
    session.status === 'COMPLETED' && Boolean(session.score);

  return (
    <div className="space-y-8 print:bg-white">
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between print:hidden">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Employer report
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-950">
            {candidateIdentifier}
          </h2>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Employer-facing assessment report for structured campaign review.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <EmployerReportPrintButton />

          <Link
            href={`/employer/campaigns/${encodeURIComponent(
              campaign.id
            )}/candidates/${encodeURIComponent(session.id)}`}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Back to candidate
          </Link>
        </div>
      </section>

      {!report ? (
        <div className="space-y-4">
          <EmployerStatePanel
            eyebrow="Report not generated"
            title="No employer report is available yet"
            body="This candidate has no generated employer report. Generate the report once the session is completed and scoring is available."
            tone="warning"
          />

          <EmployerReportActions
            campaignId={campaign.id}
            candidateId={session.id}
            sessionId={session.id}
            canGenerateReport={canGenerateReport}
          />
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            IQMeridian employer assessment report
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            {candidateIdentifier}
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Campaign: {campaign.name}
          </p>

          <p className="mt-1 text-sm text-slate-600">
            Report status: {report ? 'Generated' : 'Not generated'} · Generated:{' '}
            {getGeneratedAt(report)}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Overall performance band"
            value={score?.overallBand ?? 'Not available'}
          />

          <MetricCard
            label="Abstract reasoning band"
            value={score?.abstractBand ?? 'Not available'}
          />

          <MetricCard
            label="Numerical reasoning band"
            value={score?.numericalBand ?? 'Not available'}
          />
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-950">
              Score summary
            </h3>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-slate-500">
                  Overall raw score
                </dt>
                <dd className="mt-1 text-slate-950">
                  {score?.overallRawScore !== undefined &&
                  score?.overallMaxScore !== undefined
                    ? `${score.overallRawScore} / ${score.overallMaxScore}`
                    : 'Not available'}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">
                  Overall composite
                </dt>
                <dd className="mt-1 text-slate-950">
                  {score?.overallComposite !== undefined
                    ? `${score.overallComposite}%`
                    : 'Not available'}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">
                  Completion timestamp
                </dt>
                <dd className="mt-1 text-slate-950">
                  {session.completedAt
                    ? new Date(session.completedAt).toLocaleString()
                    : 'Not completed'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-950">
              Candidate context
            </h3>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Candidate email</dt>
                <dd className="mt-1 text-slate-950">
                  {invitation?.email ?? session.user?.email ?? 'Not available'}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">Session status</dt>
                <dd className="mt-1 text-slate-950">{session.status}</dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">Report ID</dt>
                <dd className="mt-1 break-all text-slate-950">
                  {report?.id ?? 'Not generated'}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-lg font-semibold text-slate-950">
            Interpretation guidance
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            This report supports structured employer review within this campaign
            context. It should not be treated as a final hiring decision, a
            diagnosis, or a complete measure of candidate capability.
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use these results alongside interviews, role-relevant work evidence,
            accessibility considerations, and consistent selection criteria.
          </p>
        </section>
      </section>
    </div>
  );
};
