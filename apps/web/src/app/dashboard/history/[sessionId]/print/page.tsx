import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getDefaultDashboardForRole, isAppRole } from '@/lib/role-routing';

import {
  listConsumerSessionsWithPsychometricScores,
  type ConsumerPsychometricDomainScore,
  type ConsumerPsychometricScoreResult,
  type ConsumerSessionSummary,
} from '../../../consumer-dashboard-api';
import { PrintActionsClient } from './print-actions-client';

type PrintableResultPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  searchParams?: Promise<{
    autoPrint?: string;
  }>;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const formatScoreBand = (value?: string | null) => {
  if (!value) return 'Unavailable';

  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatWholeNumber = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return Math.round(value).toString();
};

const formatAccuracy = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return `${Math.round(value * 100)}%`;
};

const formatPercentile = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return `${Math.round(value)}th percentile`;
};

const formatDecimal = (value?: number | null, digits = 2) => {
  if (typeof value !== 'number') return 'Not available';

  return value.toFixed(digits);
};

const getPrimaryIqScore = (score?: ConsumerPsychometricScoreResult | null) => {
  return score?.overallIqScore ?? score?.overallStandardScore ?? null;
};

const getPrimaryIqPercentile = (
  score?: ConsumerPsychometricScoreResult | null
) => {
  return score?.overallIqPercentile ?? score?.overallPercentile ?? null;
};

const getDomainIqScore = (
  domainScore?: ConsumerPsychometricDomainScore | null
) => {
  return domainScore?.iqScore ?? domainScore?.standardScore ?? null;
};

const formatIqScoreInterval = (
  score?: ConsumerPsychometricScoreResult | null
) => {
  if (
    typeof score?.overallIqCi90Lower === 'number' &&
    typeof score.overallIqCi90Upper === 'number'
  ) {
    return `${Math.round(score.overallIqCi90Lower)}-${Math.round(
      score.overallIqCi90Upper
    )}`;
  }

  if (
    typeof score?.overallCi90Lower === 'number' &&
    typeof score.overallCi90Upper === 'number'
  ) {
    return `${Math.round(100 + score.overallCi90Lower * 15)}-${Math.round(
      100 + score.overallCi90Upper * 15
    )}`;
  }

  return 'Not available';
};

const getSessionTitle = (session?: ConsumerSessionSummary | null) => {
  return (
    session?.assessmentForm?.name ??
    session?.assessmentForm?.title ??
    session?.campaign?.name ??
    'IQMeridian assessment'
  );
};

const getValidityLabel = (score?: ConsumerPsychometricScoreResult | null) => {
  const flags = score?.validityFlags ?? [];

  if (flags.some((flag) => flag.severity === 'HIGH')) {
    return 'Low-validity attempt';
  }

  if (flags.some((flag) => flag.severity === 'MEDIUM')) {
    return 'Interpret with caution';
  }

  if (flags.some((flag) => flag.severity === 'LOW')) {
    return 'Minor validity notice';
  }

  return score ? 'Clean attempt' : 'Not available';
};

export default async function PrintableResultPage({
  params,
  searchParams,
}: PrintableResultPageProps) {
  const authSession = await auth();
  const role = authSession?.user?.role;
  const { sessionId } = await params;
  const resolvedSearchParams = await searchParams;

  if (!authSession?.user || !isAppRole(role)) {
    redirect(
      `/login?callbackUrl=/dashboard/history/${encodeURIComponent(
        sessionId
      )}/print`
    );
  }

  if (role !== 'CONSUMER') {
    redirect(getDefaultDashboardForRole(role));
  }

  let sessionRecord: ConsumerSessionSummary | null = null;
  let score: ConsumerPsychometricScoreResult | null = null;

  try {
    const sessions = await listConsumerSessionsWithPsychometricScores();

    sessionRecord =
      sessions.find(
        (assessmentSession) => assessmentSession.id === sessionId
      ) ?? null;

    score = sessionRecord?.psychometricScore ?? null;
  } catch {
    score = null;
  }

  const iqScore = getPrimaryIqScore(score);
  const iqPercentile = getPrimaryIqPercentile(score);
  const iqInterval = formatIqScoreInterval(score);
  const domainScores = [...(score?.domainScores ?? [])].sort(
    (left, right) =>
      (getDomainIqScore(right) ?? 0) - (getDomainIqScore(left) ?? 0)
  );

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <PrintActionsClient
          autoPrint={resolvedSearchParams?.autoPrint === '1'}
        />

        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
              IQMeridian
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              IQ Result Report
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {getSessionTitle(sessionRecord)}
            </p>
          </div>

          <Link
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-700 print:hidden"
            href={`/dashboard/history/${sessionId}`}
          >
            Back to details
          </Link>
        </div>

        {!score ? (
          <section className="rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-black">Result unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This result could not be loaded, has not been scored, or is not
              available to this account.
            </p>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-slate-200 p-6 text-center">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                IQ Score
              </p>
              <p className="mt-4 text-7xl font-black tracking-tight text-slate-950">
                {formatWholeNumber(iqScore)}
              </p>
              <p className="mt-3 text-sm font-bold text-slate-500">
                IQMeridian IQ Score
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Percentile
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {formatPercentile(iqPercentile)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    90% IQ interval
                  </p>
                  <p className="mt-2 text-lg font-black">{iqInterval}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Band
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {formatScoreBand(score.overallScoreBand)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Validity
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {getValidityLabel(score)}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Accuracy
                </p>
                <p className="mt-2 text-xl font-black">
                  {formatAccuracy(score.overallAccuracy)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Raw score
                </p>
                <p className="mt-2 text-xl font-black">
                  {score.overallRawScore}/{score.overallMaxRawScore}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Reliability
                </p>
                <p className="mt-2 text-xl font-black">
                  {formatDecimal(score.overallReliability)}
                </p>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-black">Domain breakdown</h2>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border-b border-slate-200 px-4 py-3">
                        Domain
                      </th>
                      <th className="border-b border-slate-200 px-4 py-3">
                        IQ Score
                      </th>
                      <th className="border-b border-slate-200 px-4 py-3">
                        Percentile
                      </th>
                      <th className="border-b border-slate-200 px-4 py-3">
                        Accuracy
                      </th>
                      <th className="border-b border-slate-200 px-4 py-3">
                        Band
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {domainScores.map((domainScore) => (
                      <tr key={domainScore.id}>
                        <td className="border-b border-slate-100 px-4 py-3 font-bold">
                          {domainScore.label}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {formatWholeNumber(getDomainIqScore(domainScore))}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {formatPercentile(
                            domainScore.iqPercentile ?? domainScore.percentile
                          )}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {formatAccuracy(domainScore.accuracy)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {formatScoreBand(domainScore.scoreBand)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-black">Validity notes</h2>

                <div className="mt-4 space-y-3">
                  {score.validityFlags.length > 0 ? (
                    score.validityFlags.map((flag) => (
                      <div
                        className="rounded-2xl border border-slate-200 p-4"
                        key={flag.id}
                      >
                        <div className="flex justify-between gap-3">
                          <p className="font-black">{flag.label}</p>
                          <p className="text-xs font-black uppercase text-slate-500">
                            {flag.severity}
                          </p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {flag.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                      No validity flags were returned for this attempt.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-black">Scoring metadata</h2>

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-bold text-slate-500">Scoring status</dt>
                    <dd className="font-black">{score.scoringStatus}</dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">Engine</dt>
                    <dd className="break-words font-black">
                      {score.scoringEngineVersion ?? 'Not available'}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">Model version</dt>
                    <dd className="break-words font-black">
                      {score.scoringModelVersion ?? score.modelVersion}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">Feature set</dt>
                    <dd className="break-words font-black">
                      {score.featureSetVersion ?? 'Not available'}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">Generated</dt>
                    <dd className="font-black">
                      {formatDate(score.generatedAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="mt-8 border-t border-slate-200 pt-5">
              <h2 className="text-xl font-black">Interpretation</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {score.overallInterpretation}
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
