import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getDefaultDashboardForRole, isAppRole } from '@/lib/role-routing';

import {
  getConsumerSessionPsychometricScore,
  listConsumerSessionsWithPsychometricScores,
  type ConsumerPsychometricDomainScore,
  type ConsumerPsychometricScoreResult,
  type ConsumerSessionSummary,
} from '../../consumer-dashboard-api';

type TestHistoryDetailPageProps = {
  params: Promise<{
    sessionId: string;
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

const formatDecimal = (value?: number | null, digits = 2) => {
  if (typeof value !== 'number') return 'Not available';

  return value.toFixed(digits);
};

const formatAccuracy = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return `${Math.round(value * 100)}%`;
};

const formatPercentile = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return `${Math.round(value)}th percentile`;
};

const formatDuration = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  const totalSeconds = Math.round(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
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

const getSignalCount = (score?: ConsumerPsychometricScoreResult | null) => {
  const summary = score?.scoringFeatureSummary;

  if (
    typeof summary === 'object' &&
    summary !== null &&
    !Array.isArray(summary) &&
    'signalCount' in summary
  ) {
    const signalCount = (summary as { signalCount?: unknown }).signalCount;

    if (typeof signalCount === 'number') {
      return signalCount;
    }
  }

  const signals = score?.scoringSignalsUsed;

  if (Array.isArray(signals)) {
    return signals.length;
  }

  return null;
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

const getValidityClassName = (
  score?: ConsumerPsychometricScoreResult | null
) => {
  const flags = score?.validityFlags ?? [];

  if (flags.some((flag) => flag.severity === 'HIGH')) {
    return 'border-red-300/20 bg-red-400/10 text-red-100';
  }

  if (flags.some((flag) => flag.severity === 'MEDIUM')) {
    return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
  }

  if (flags.some((flag) => flag.severity === 'LOW')) {
    return 'border-blue-300/20 bg-blue-400/10 text-blue-100';
  }

  return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
};

export default async function TestHistoryDetailPage({
  params,
}: TestHistoryDetailPageProps) {
  const session = await auth();
  const role = session?.user?.role;
  const { sessionId } = await params;

  if (!session?.user || !isAppRole(role)) {
    redirect(
      `/login?callbackUrl=/dashboard/history/${encodeURIComponent(sessionId)}`
    );
  }

  if (role !== 'CONSUMER') {
    redirect(getDefaultDashboardForRole(role));
  }

  let score: ConsumerPsychometricScoreResult | null = null;
  let sessionRecord: ConsumerSessionSummary | null = null;
  let pageError: string | null = null;

  try {
    const [scoreResult, sessions] = await Promise.all([
      getConsumerSessionPsychometricScore(sessionId),
      listConsumerSessionsWithPsychometricScores(),
    ]);

    score = scoreResult;
    sessionRecord =
      sessions.find(
        (assessmentSession) => assessmentSession.id === sessionId
      ) ?? null;
  } catch (error) {
    pageError =
      error instanceof Error
        ? error.message
        : 'Unable to load this IQ Score profile.';
  }

  const iqScore = getPrimaryIqScore(score);
  const iqPercentile = getPrimaryIqPercentile(score);
  const iqInterval = formatIqScoreInterval(score);
  const signalCount = getSignalCount(score);

  const sortedDomainScores = [...(score?.domainScores ?? [])].sort(
    (left, right) =>
      (getDomainIqScore(right) ?? 0) - (getDomainIqScore(left) ?? 0)
  );

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              Test details
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              {getSessionTitle(sessionRecord)}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              This page contains the detailed IQMeridian profile for one scored
              assessment attempt. The IQ Score is the headline result; all other
              metrics explain its context and reliability.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className="w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/15"
              href={`/dashboard/history/${sessionId}/print?autoPrint=1`}
              target="_blank"
            >
              Print / Save PDF
            </Link>

            <Link
              className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
              href="/dashboard/history"
            >
              Back to Test History
            </Link>
          </div>
        </div>
      </section>

      {pageError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <span>{pageError}</span>
        </div>
      ) : null}

      {!score ? (
        <section className="rounded-[2rem] border border-dashed border-white/10 bg-[#07142f]/82 p-8">
          <h2 className="text-2xl font-black text-white">
            Score profile not available
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            This test either has not been scored yet, does not belong to this
            account, or is not available for detailed viewing.
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="rounded-[2rem] border border-cyan-300/20 bg-[#020817]/80 p-6 text-center shadow-[0_24px_80px_rgba(8,145,178,0.12)]">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
                IQ Score
              </p>
              <p className="mt-4 text-7xl font-black tracking-tight text-white md:text-8xl">
                {formatWholeNumber(iqScore)}
              </p>
              <p className="mt-4 text-sm font-bold text-slate-300">
                IQMeridian IQ Score
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Percentile
                  </p>
                  <p className="mt-2 text-lg font-black text-white">
                    {formatPercentile(iqPercentile)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    90% IQ interval
                  </p>
                  <p className="mt-2 text-lg font-black text-white">
                    {iqInterval}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Cognitive band
                  </p>
                  <p className="mt-2 text-lg font-black text-white">
                    {formatScoreBand(score.overallScoreBand)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Validity
                  </p>
                  <p className="mt-2 text-lg font-black text-white">
                    {getValidityLabel(score)}
                  </p>
                </div>
              </div>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Accuracy
                </dt>
                <dd className="mt-2 text-2xl font-black text-white">
                  {formatAccuracy(score.overallAccuracy)}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Raw score
                </dt>
                <dd className="mt-2 text-2xl font-black text-white">
                  {score.overallRawScore}/{score.overallMaxRawScore}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Reliability
                </dt>
                <dd className="mt-2 text-2xl font-black text-white">
                  {formatDecimal(score.overallReliability)}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Signals used
                </dt>
                <dd className="mt-2 text-2xl font-black text-white">
                  {typeof signalCount === 'number'
                    ? signalCount
                    : 'Not available'}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Leaderboard
                </dt>
                <dd className="mt-2 text-2xl font-black text-white">
                  {score.leaderboardEligible ? 'Eligible' : 'Pending'}
                </dd>
              </div>
            </dl>

            <div
              className={`mt-6 rounded-2xl border p-5 text-sm leading-7 ${getValidityClassName(
                score
              )}`}
            >
              <p className="font-black">{getValidityLabel(score)}</p>
              <p className="mt-1">
                {score.validityFlags.length > 0
                  ? 'This attempt has validity notices. Interpret the IQ Score with the listed flags and confidence interval.'
                  : 'No major validity issues were detected for this attempt.'}
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                  <Brain size={20} strokeWidth={2} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                    Domain profile
                  </p>
                  <h2 className="text-xl font-black text-white">
                    Cognitive domain breakdown
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {sortedDomainScores.length > 0 ? (
                  sortedDomainScores.map((domainScore) => (
                    <div
                      className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                      key={domainScore.id}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="font-black text-white">
                            {domainScore.label}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {domainScore.interpretation}
                          </p>
                        </div>

                        <div className="md:text-right">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            IQ Score
                          </p>
                          <p className="mt-1 text-2xl font-black text-cyan-100">
                            {formatWholeNumber(getDomainIqScore(domainScore))}
                          </p>
                        </div>
                      </div>

                      <dl className="mt-4 grid gap-3 sm:grid-cols-4">
                        <div>
                          <dt className="text-xs font-bold text-slate-500">
                            Band
                          </dt>
                          <dd className="mt-1 font-black text-white">
                            {formatScoreBand(domainScore.scoreBand)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold text-slate-500">
                            Accuracy
                          </dt>
                          <dd className="mt-1 font-black text-white">
                            {formatAccuracy(domainScore.accuracy)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold text-slate-500">
                            Percentile
                          </dt>
                          <dd className="mt-1 font-black text-white">
                            {formatPercentile(
                              domainScore.iqPercentile ?? domainScore.percentile
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold text-slate-500">
                            Reliability
                          </dt>
                          <dd className="mt-1 font-black text-white">
                            {formatDecimal(domainScore.reliability)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.035] p-5">
                    <h3 className="font-black text-white">
                      No domain scores available
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Domain-level results were not returned for this attempt.
                    </p>
                  </div>
                )}
              </div>
            </article>

            <aside className="space-y-6">
              <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 text-emerald-200">
                    <ShieldCheck size={20} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                      Validity
                    </p>
                    <h2 className="text-xl font-black text-white">
                      Validity flags
                    </h2>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {score.validityFlags.length > 0 ? (
                    score.validityFlags.map((flag) => (
                      <div
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                        key={flag.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-black text-white">
                            {flag.label}
                          </h3>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-black text-slate-300">
                            {flag.severity}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {flag.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
                      <CheckCircle2
                        className="mb-2 text-emerald-200"
                        size={18}
                        strokeWidth={2}
                      />
                      No validity flags were returned for this attempt.
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-300/15 bg-blue-400/10 text-blue-200">
                    <Clock3 size={20} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
                      Timing
                    </p>
                    <h2 className="text-xl font-black text-white">
                      Response timing
                    </h2>
                  </div>
                </div>

                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="font-bold text-slate-500">
                      Total response time
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {formatDuration(score.timingTotalResponseTimeMs)}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">
                      Median response time
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {formatDuration(score.timingMedianResponseTimeMs)}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">
                      Rapid guessing rate
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {formatAccuracy(score.timingRapidGuessingRate)}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">Omission rate</dt>
                    <dd className="mt-1 font-black text-white">
                      {formatAccuracy(score.timingOmissionRate)}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-400/10 text-violet-200">
                    <BarChart3 size={20} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
                      Engine
                    </p>
                    <h2 className="text-xl font-black text-white">
                      Scoring model
                    </h2>
                  </div>
                </div>

                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="font-bold text-slate-500">Scoring status</dt>
                    <dd className="mt-1 font-black text-white">
                      {score.scoringStatus}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">Scoring engine</dt>
                    <dd className="mt-1 break-words font-black text-white">
                      {score.scoringEngineVersion ?? 'Not available'}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">Model version</dt>
                    <dd className="mt-1 break-words font-black text-white">
                      {score.scoringModelVersion ?? score.modelVersion}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">Feature set</dt>
                    <dd className="mt-1 break-words font-black text-white">
                      {score.featureSetVersion ?? 'Not available'}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">Generated</dt>
                    <dd className="mt-1 font-black text-white">
                      {formatDate(score.generatedAt)}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                    <FileText size={20} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                      Interpretation
                    </p>
                    <h2 className="text-xl font-black text-white">
                      Score note
                    </h2>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-400">
                  {score.overallInterpretation}
                </p>
              </article>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}
