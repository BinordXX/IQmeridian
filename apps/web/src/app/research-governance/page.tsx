import {
  PublicBulletList,
  PublicCard,
  PublicMetric,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';

export const metadata = {
  title: 'Research Governance | IQMeridian',
  description:
    'IQMeridian research governance, psychometric validation, and calibration-readiness information.',
};

const governanceAreas = [
  {
    title: 'Psychometric caution',
    items: [
      'Current scoring is provisional and should be presented with calibration caveats.',
      'Standard score, percentile, and score interval outputs require norming before certified IQ interpretation.',
      'Validity flags should be considered part of the result, not an optional footnote.',
    ],
  },
  {
    title: 'Data governance',
    items: [
      'Export workflows should remain controlled and auditable.',
      'Researcher access should stay separated from candidate and employer dashboards.',
      'Session and response data should be handled with clear retention and privacy policies.',
    ],
  },
  {
    title: 'Validation pathway',
    items: [
      'Item calibration should be based on sufficient response volume and item-performance review.',
      'Reliability, fairness, and adverse-impact checks should precede high-stakes use.',
      'Report language should distinguish provisional insight from certified psychometric claims.',
    ],
  },
];

export default function ResearchGovernancePage() {
  return (
    <PublicPageShell
      eyebrow="Research governance"
      title="IQMeridian is built to grow into validated psychometric infrastructure."
      description="The platform’s research direction is centred on item quality, validity evidence, calibration readiness, controlled exports, and audit-backed internal review."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <PublicMetric
          description="Scoring outputs are labelled and interpreted with caution before formal norming."
          label="scoring status"
          value="Provisional"
        />
        <PublicMetric
          description="Internal tooling supports item, session, response, suspicious-session, and export review."
          label="research tooling"
          value="Active"
        />
        <PublicMetric
          description="Audit events support governance traceability across sensitive workflows."
          label="audit posture"
          value="Traceable"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {governanceAreas.map((area) => (
          <PublicCard key={area.title}>
            <h2 className="text-2xl font-black text-white">{area.title}</h2>
            <PublicBulletList items={area.items} />
          </PublicCard>
        ))}
      </div>

      <PublicCard className="mt-6">
        <PublicSectionHeading
          eyebrow="Position"
          title="Credibility comes from restraint."
          description="IQMeridian should impress visitors with technical sophistication, but the public message must remain disciplined: the system is infrastructure moving toward validated intelligence reporting, not a shortcut to unsupported IQ claims."
        />
      </PublicCard>
    </PublicPageShell>
  );
}