import Link from 'next/link';

import type {
  EmployerCampaignDetail,
  EmployerInvitationSummary,
  EmployerSessionSummary,
} from '../api/employer-dashboard-api';
import { EmployerReportActions } from './employer-report-actions';

type EmployerCandidateDetailProps = {
  campaign: EmployerCampaignDetail;
  invitation?: EmployerInvitationSummary;
  session?: EmployerSessionSummary;
};

const getCompletionState = (session?: EmployerSessionSummary): string => {
  if (!session) {
    return 'Not started';
  }

  if (session.status === 'COMPLETED') {
    return 'Completed';
  }

  if (session.status === 'IN_PROGRESS') {
    return 'In progress';
  }

  if (session.status === 'EXPIRED') {
    return 'Expired';
  }

  if (session.status === 'ABANDONED') {
    return 'Abandoned';
  }

  return session.status;
};

const getCandidateIdentifier = (
  invitation?: EmployerInvitationSummary,
  session?: EmployerSessionSummary
): string => {
  return (
    session?.user?.name ??
    session?.user?.email ??
    invitation?.email ??
    invitation?.candidateUserId ??
    session?.userId ??
    'Candidate'
  );
};

const BandCard = ({ label, band }: { label: string; band?: string }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-950">
        {band ?? 'Not available'}
      </p>
    </div>
  );
};

export const EmployerCandidateDetail = ({
  campaign,
  invitation,
  session,
}: EmployerCandidateDetailProps) => {
  const score = session?.score;
  const candidateIdentifier = getCandidateIdentifier(invitation, session);

  const answeredCount = session?.responses?.length ?? 0;
  const completedAt = session?.completedAt;
  const canGenerateReport =
    session?.status === 'COMPLETED' && Boolean(session.score);
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Candidate result detail
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-950">
            {candidateIdentifier}
          </h2>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Employer-facing candidate assessment view for this campaign. Bands
            are intended as structured decision support and should be considered
            alongside the wider hiring process.
          </p>
        </div>

        <Link
          href={`/employer/campaigns/${encodeURIComponent(campaign.id)}`}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
        >
          Back to campaign
        </Link>
      </section>
      <EmployerReportActions
        campaignId={campaign.id}
        candidateId={session?.id ?? invitation?.id ?? 'candidate'}
        sessionId={session?.id}
        canGenerateReport={canGenerateReport}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <BandCard label="Overall performance band" band={score?.overallBand} />
        <BandCard label="Abstract reasoning band" band={score?.abstractBand} />
        <BandCard
          label="Numerical reasoning band"
          band={score?.numericalBand}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Completion state</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {getCompletionState(session)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            Candidate and campaign context
          </h3>

          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Campaign</dt>
              <dd className="mt-1 text-slate-950">{campaign.name}</dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">Candidate email</dt>
              <dd className="mt-1 text-slate-950">
                {invitation?.email ?? session?.user?.email ?? 'Not available'}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">Invitation status</dt>
              <dd className="mt-1 text-slate-950">
                {invitation?.status ?? 'No invitation record'}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">Session status</dt>
              <dd className="mt-1 text-slate-950">
                {session?.status ?? 'No session started'}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">Completed at</dt>
              <dd className="mt-1 text-slate-950">
                {completedAt
                  ? new Date(completedAt).toLocaleString()
                  : 'Not completed'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            Completion metrics
          </h3>

          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Responses saved</dt>
              <dd className="mt-1 text-slate-950">{answeredCount}</dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">Overall raw score</dt>
              <dd className="mt-1 text-slate-950">
                {score?.overallRawScore !== undefined &&
                score?.overallMaxScore !== undefined
                  ? `${score.overallRawScore} / ${score.overallMaxScore}`
                  : 'Not available'}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">Overall composite</dt>
              <dd className="mt-1 text-slate-950">
                {score?.overallComposite !== undefined
                  ? `${score.overallComposite}%`
                  : 'Not available'}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-lg font-semibold text-slate-950">
          Interpretive note
        </h3>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          These bands summarise performance within the configured assessment
          form and should not be treated as a complete measure of intelligence,
          employability, or role suitability. They are most useful when combined
          with structured interviews, role-relevant evidence, and consistent
          hiring criteria.
        </p>
      </section>
    </div>
  );
};
