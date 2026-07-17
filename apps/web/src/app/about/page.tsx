import {
  PublicBulletList,
  PublicCard,
  PublicMetric,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';

export const metadata = {
  title: 'About IQMeridian',
  description:
    'Learn about IQMeridian, an intelligence assessment infrastructure platform.',
};

const principles = [
  'Build cognitive assessment as infrastructure, not as a casual quiz experience.',
  'Separate provisional scoring from certified IQ interpretation until formal validation is complete.',
  'Make validity, confidence, and governance visible inside the product.',
  'Support candidates, employers, researchers, and administrators with separate role-aware workflows.',
];

const maturityItems = [
  {
    value: '01',
    label: 'MVP infrastructure',
    description:
      'Assessment delivery, session capture, scoring persistence, dashboards, and internal tooling.',
  },
  {
    value: '02',
    label: 'Calibration readiness',
    description:
      'Item analysis, validity review, response exports, suspicious-session inspection, and research workflows.',
  },
  {
    value: '03',
    label: 'Validated reporting',
    description:
      'Formal norming, reliability validation, report governance, and high-stakes-readiness controls.',
  },
];

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="About"
      title="IQMeridian is building serious intelligence assessment infrastructure."
      description="The platform is designed to evolve from MVP assessment delivery into a calibrated intelligence profile ecosystem with psychometric discipline, role-based access, and governance controls."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <PublicCard>
          <PublicSectionHeading
            eyebrow="Mission"
            title="Make intelligence measurement structured, explainable, and governed."
            description="IQMeridian is not being built as a simple score generator. The product combines assessment sessions, response evidence, scoring outputs, validity flags, dashboards, internal tooling, and governance workflows."
          />

          <PublicBulletList items={principles} />
        </PublicCard>

        <PublicCard>
          <PublicSectionHeading
            eyebrow="Founder"
            title="Led by Binord Francis."
            description="Binord Francis leads IQMeridian’s product vision, assessment strategy, and long-term direction toward credible intelligence profiling."
          />

          <div className="mt-8 rounded-[1.75rem] border border-cyan-300/15 bg-white/[0.04] p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-400/10 text-2xl font-black text-cyan-200 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
              BF
            </div>
            <h2 className="mt-6 text-2xl font-black text-white">
              Binord Francis
            </h2>
            <p className="mt-2 text-sm font-bold text-cyan-300">
              Founder & Chief Executive Officer
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Responsible for the product direction, platform positioning, and
              strategic roadmap of IQMeridian.
            </p>
          </div>
        </PublicCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {maturityItems.map((item) => (
          <PublicMetric
            description={item.description}
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </PublicPageShell>
  );
}
