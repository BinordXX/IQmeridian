import {
  PublicBulletList,
  PublicCard,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';

export const metadata = {
  title: 'Resources | IQMeridian',
  description: 'IQMeridian resources and public knowledge hub.',
};

const resourceAreas = [
  {
    title: 'Understanding score profiles',
    items: [
      'What standard scores mean',
      'How percentiles should be interpreted',
      'Why confidence intervals and precision matter',
      'Why validity flags should not be ignored',
    ],
  },
  {
    title: 'Assessment governance',
    items: [
      'Why provisional scoring is different from certified IQ reporting',
      'How calibration and norming improve interpretation',
      'Why high-stakes usage requires validation',
      'How audit trails support trust',
    ],
  },
  {
    title: 'Platform guides',
    items: [
      'Candidate dashboard overview',
      'Employer campaign direction',
      'Researcher tooling overview',
      'API and integration roadmap',
    ],
  },
];

export default function ResourcesPage() {
  return (
    <PublicPageShell
      eyebrow="Resources"
      title="A public knowledge hub for intelligence assessment."
      description="Resources will grow into IQMeridian’s education layer: score interpretation, assessment science, platform guides, governance notes, and API documentation."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {resourceAreas.map((area) => (
          <PublicCard key={area.title}>
            <h2 className="text-2xl font-black text-white">{area.title}</h2>
            <PublicBulletList items={area.items} />
          </PublicCard>
        ))}
      </div>

      <PublicCard className="mt-6">
        <PublicSectionHeading
          eyebrow="Direction"
          title="Resources should make the platform feel serious, not merely promotional."
          description="As IQMeridian grows, this section can host whitepapers, validation notes, score interpretation guides, employer documentation, researcher references, and API documentation."
        />
      </PublicCard>
    </PublicPageShell>
  );
}
