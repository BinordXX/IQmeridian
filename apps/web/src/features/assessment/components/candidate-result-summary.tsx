import Link from 'next/link';

type CandidateResultSummaryProps = {
  overallBand: string;
  abstractReasoningBand: string;
  numericalReasoningBand: string;
  audience: 'employer-invited' | 'consumer';
};

const formatBand = (value: string) => {
  return value.replaceAll('_', ' ');
};

export const CandidateResultSummary = ({
  overallBand,
  abstractReasoningBand,
  numericalReasoningBand,
  audience,
}: CandidateResultSummaryProps) => {
  const isConsumer = audience === 'consumer';

  return (
    <section className="rounded-[1.75rem] border border-cyan-300/15 bg-[#07142f]/95 p-5 shadow-2xl shadow-black/30 sm:rounded-[2rem] sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
        {isConsumer ? 'IQMERIDIAN RESULT' : 'LIMITED RESULT SUMMARY'}
      </p>

      <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
        {isConsumer ? 'Your IQMeridian result' : 'Assessment summary'}
      </h1>

      <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
        {isConsumer
          ? 'This is your current IQMeridian assessment profile based on your completed attempt. It is provided for personal orientation and should be read with the stated scoring limitations.'
          : 'This summary is provided for personal orientation only. It is not a diagnostic judgement, a clinical interpretation, or a fixed statement of cognitive potential.'}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-300/15 bg-[#020817]/75 p-5">
          <p className="text-sm font-black text-slate-400">
            Overall performance band
          </p>
          <p className="mt-4 text-2xl font-black text-cyan-50">
            {formatBand(overallBand)}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/15 bg-[#020817]/75 p-5">
          <p className="text-sm font-black text-slate-400">
            Abstract reasoning band
          </p>
          <p className="mt-4 text-2xl font-black text-cyan-50">
            {formatBand(abstractReasoningBand)}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/15 bg-[#020817]/75 p-5">
          <p className="text-sm font-black text-slate-400">
            Numerical reasoning band
          </p>
          <p className="mt-4 text-2xl font-black text-cyan-50">
            {formatBand(numericalReasoningBand)}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#020817]/70 p-5">
        <h2 className="text-xl font-black text-white">
          {isConsumer ? 'How to read your result' : 'How to read this summary'}
        </h2>

        <p className="mt-4 text-sm leading-7 text-slate-300">
          {isConsumer
            ? 'Your result is a current assessment profile, not a permanent measure of intelligence or future performance. IQMeridian will become more informative as calibrated items, scoring data, and repeated valid attempts mature.'
            : 'These bands are restrained indicators of performance within this assessment attempt. They should not be read as a complete measure of intelligence, employability, learning capacity, or future performance. The summary is intentionally limited so that it supports feedback without overstating what the assessment can validly claim.'}
        </p>
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