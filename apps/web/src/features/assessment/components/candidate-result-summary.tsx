import Link from 'next/link';

type CandidateResultSummaryProps = {
  iqScore?: number | null;
  iqPercentile?: number | null;
  iqConfidenceInterval90?: {
    lower: number | null;
    upper: number | null;
  };
  overallBand?: string | null;
  abstractReasoningBand?: string | null;
  numericalReasoningBand?: string | null;
  scoringStatus?: string | null;
  scoringEngineVersion?: string | null;
  scoringModelVersion?: string | null;
  featureSetVersion?: string | null;
  signalCount?: number | null;
  leaderboardEligible?: boolean | null;
  validityFlagCount?: number;
  generatedAt?: string | null;
  audience: 'employer-invited' | 'consumer';
};

const formatBand = (value?: string | null) => {
  if (!value) return 'Unavailable';

  return value.replaceAll('_', ' ');
};

const formatIqScore = (value?: number | null) => {
  if (typeof value !== 'number') return 'Pending';

  return Math.round(value).toString();
};

const formatPercentile = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return `${Math.round(value)}th percentile`;
};

const formatIqInterval = (
  interval?: {
    lower: number | null;
    upper: number | null;
  } | null
) => {
  if (
    typeof interval?.lower !== 'number' ||
    typeof interval?.upper !== 'number'
  ) {
    return 'Not available';
  }

  return `${Math.round(interval.lower)}-${Math.round(interval.upper)}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

export const CandidateResultSummary = ({
  iqScore,
  iqPercentile,
  iqConfidenceInterval90,
  overallBand,
  abstractReasoningBand,
  numericalReasoningBand,
  scoringStatus,
  scoringEngineVersion,
  scoringModelVersion,
  featureSetVersion,
  signalCount,
  leaderboardEligible,
  validityFlagCount,
  generatedAt,
  audience,
}: CandidateResultSummaryProps) => {
  const isConsumer = audience === 'consumer';
  const generatedLabel = formatDate(generatedAt);

  return (
    <section className="rounded-[1.75rem] border border-cyan-300/15 bg-[#07142f]/95 p-5 shadow-2xl shadow-black/30 sm:rounded-[2rem] sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
        {isConsumer ? 'IQMERIDIAN IQ PROFILE' : 'LIMITED IQ SCORE SUMMARY'}
      </p>

      <div className="mt-6 rounded-[2rem] border border-cyan-300/20 bg-[#020817]/80 p-6 text-center shadow-[0_24px_80px_rgba(8,145,178,0.12)]">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
          IQ Score
        </p>

        <p className="mt-4 text-7xl font-black tracking-tight text-white sm:text-8xl">
          {formatIqScore(iqScore)}
        </p>

        <p className="mt-4 text-sm font-bold text-slate-300">
          IQMeridian IQ Score
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
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
              {formatIqInterval(iqConfidenceInterval90)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Cognitive band
            </p>
            <p className="mt-2 text-lg font-black text-white">
              {formatBand(overallBand)}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
        {isConsumer
          ? 'This profile is centred on your IQMeridian IQ Score. The supporting metrics below explain the score context, including cognitive band, domain performance, confidence, validity, and scoring-model details.'
          : 'This limited summary is centred on the IQMeridian IQ Score released for this assessment attempt. Supporting metrics are restrained and should be interpreted only within this assessment context.'}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-300/15 bg-[#020817]/75 p-5">
          <p className="text-sm font-black text-slate-400">
            Abstract reasoning
          </p>
          <p className="mt-4 text-2xl font-black text-cyan-50">
            {formatBand(abstractReasoningBand)}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/15 bg-[#020817]/75 p-5">
          <p className="text-sm font-black text-slate-400">
            Numerical reasoning
          </p>
          <p className="mt-4 text-2xl font-black text-cyan-50">
            {formatBand(numericalReasoningBand)}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/15 bg-[#020817]/75 p-5">
          <p className="text-sm font-black text-slate-400">Validity notices</p>
          <p className="mt-4 text-2xl font-black text-cyan-50">
            {typeof validityFlagCount === 'number'
              ? validityFlagCount
              : 'Not available'}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#020817]/70 p-5">
        <h2 className="text-xl font-black text-white">Score context</h2>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Scoring status
            </dt>
            <dd className="mt-1 font-black text-white">
              {scoringStatus ?? 'Not available'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Signals used
            </dt>
            <dd className="mt-1 font-black text-white">
              {typeof signalCount === 'number' ? signalCount : 'Not available'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Leaderboard eligible
            </dt>
            <dd className="mt-1 font-black text-white">
              {leaderboardEligible ? 'Yes' : 'No'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Scoring engine
            </dt>
            <dd className="mt-1 break-words font-black text-white">
              {scoringEngineVersion ?? 'Not available'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Model version
            </dt>
            <dd className="mt-1 break-words font-black text-white">
              {scoringModelVersion ?? 'Not available'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Feature set
            </dt>
            <dd className="mt-1 break-words font-black text-white">
              {featureSetVersion ?? 'Not available'}
            </dd>
          </div>
        </dl>

        {generatedLabel ? (
          <p className="mt-5 text-xs font-bold text-slate-500">
            Generated {generatedLabel}
          </p>
        ) : null}
      </div>

      <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5 text-sm leading-7 text-amber-100">
        This IQ Score is a platform-standardised IQMeridian estimate. It should
        be interpreted with its confidence interval, validity notices, and
        scoring-model version.
      </div>

      {isConsumer ? (
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
          >
            Back to dashboard
          </Link>
        </div>
      ) : null}
    </section>
  );
};
