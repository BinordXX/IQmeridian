type CandidateAudience = 'employer-invited' | 'consumer';

type CandidateResultSummaryProps = {
  overallBand: string;
  abstractReasoningBand: string;
  numericalReasoningBand: string;
  audience: CandidateAudience;
};

const normaliseBandLabel = (band: string): string => {
  const normalised = band.trim().toLowerCase();

  switch (normalised) {
    case 'high':
    case 'strong':
    case 'above-average':
    case 'above_average':
      return 'Strong';

    case 'moderate':
    case 'average':
    case 'expected':
      return 'Expected range';

    case 'low':
    case 'developing':
    case 'below-average':
    case 'below_average':
      return 'Developing';

    default:
      return band || 'Not available';
  }
};

const getAudienceCopy = (audience: CandidateAudience): string => {
  if (audience === 'consumer') {
    return 'This summary is provided for personal orientation only. It is not a diagnostic judgement, a clinical interpretation, or a fixed statement of cognitive potential.';
  }

  return 'This summary is a limited candidate-facing view. It avoids item-level disclosure and should be interpreted only within the assessment context set by the inviting organisation.';
};

const BandCard = ({ title, band }: { title: string; band: string }) => {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-[#020817]/75 p-5">
      <p className="text-sm font-bold text-slate-400">{title}</p>

      <p className="mt-3 text-xl font-black text-cyan-100">
        {normaliseBandLabel(band)}
      </p>
    </div>
  );
};

export const CandidateResultSummary = ({
  overallBand,
  abstractReasoningBand,
  numericalReasoningBand,
  audience,
}: CandidateResultSummaryProps) => {
  return (
    <section className="rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:rounded-[2rem] sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
        Limited result summary
      </p>

      <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
        Assessment summary
      </h1>

      <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
        {getAudienceCopy(audience)}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <BandCard title="Overall performance band" band={overallBand} />
        <BandCard
          title="Abstract reasoning band"
          band={abstractReasoningBand}
        />
        <BandCard
          title="Numerical reasoning band"
          band={numericalReasoningBand}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#020817]/75 p-5">
        <h2 className="text-lg font-black text-white">
          How to read this summary
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          These bands are restrained indicators of performance within this
          assessment attempt. They should not be read as a complete measure of
          intelligence, employability, learning capacity, or future performance.
          The summary is intentionally limited so that it supports feedback
          without overstating what the assessment can validly claim.
        </p>
      </div>
    </section>
  );
};
