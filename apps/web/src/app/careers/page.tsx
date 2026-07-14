import {
  PublicBulletList,
  PublicCard,
  PublicMetric,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';

export const metadata = {
  title: 'Careers | IQMeridian',
  description: 'Careers and future hiring direction at IQMeridian.',
};

const futureRoles = [
  'Psychometricians and assessment researchers',
  'Full-stack product engineers',
  'Security and governance specialists',
  'Product designers for assessment and reporting experiences',
];

export default function CareersPage() {
  return (
    <PublicPageShell
      eyebrow="Careers"
      title="Build the future of intelligence assessment."
      description="IQMeridian is not hiring publicly yet, but this page establishes the platform’s future talent direction and the type of team required to build credible assessment infrastructure."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <PublicCard>
          <PublicSectionHeading
            eyebrow="Future team"
            title="A serious platform needs a multidisciplinary team."
            description="IQMeridian will require engineering, psychometrics, governance, product design, and data-security capability as it matures."
          />

          <PublicBulletList items={futureRoles} />
        </PublicCard>

        <PublicCard>
          <PublicSectionHeading
            eyebrow="Culture"
            title="Scientific restraint. Product ambition."
            description="The ideal IQMeridian team combines technical ambition with caution around score interpretation, validation, and high-stakes claims."
          />

          <div className="mt-6 grid gap-4">
            <PublicMetric
              description="Assessment products must be explainable, auditable, and carefully governed."
              label="principle"
              value="Credibility"
            />
            <PublicMetric
              description="The product experience should feel advanced without becoming unserious or gimmicky."
              label="experience"
              value="Premium"
            />
          </div>
        </PublicCard>
      </div>
    </PublicPageShell>
  );
}
