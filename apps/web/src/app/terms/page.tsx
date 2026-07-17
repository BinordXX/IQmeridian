import {
  PublicBulletList,
  PublicCard,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';

export const metadata = {
  title: 'Terms | IQMeridian',
  description: 'IQMeridian terms placeholder.',
};

const termsItems = [
  'IQMeridian’s current assessment and scoring outputs are provisional and should not be treated as certified IQ results.',
  'Users should not rely on MVP-stage score outputs for clinical, educational, employment, immigration, or other high-stakes decisions.',
  'Employer and research use should remain subject to validation, fairness review, access control, privacy governance, and reporting safeguards.',
  'Formal terms of service should be reviewed and approved before production launch.',
];

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Terms"
      title="Terms of service placeholder."
      description="This page is a development-stage placeholder for IQMeridian’s public terms. It should be replaced with formal legal terms before production launch."
    >
      <PublicCard>
        <PublicSectionHeading
          eyebrow="Usage boundaries"
          title="The platform must be used with appropriate caution."
          description="IQMeridian is being developed as serious cognitive assessment infrastructure, but its current MVP outputs require careful interpretation."
        />

        <PublicBulletList items={termsItems} />
      </PublicCard>
    </PublicPageShell>
  );
}
