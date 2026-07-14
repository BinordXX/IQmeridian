import {
  PublicBulletList,
  PublicCard,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';

export const metadata = {
  title: 'Privacy | IQMeridian',
  description: 'IQMeridian privacy placeholder.',
};

const privacyItems = [
  'Account data may include name, email address, role, login status, and authentication metadata.',
  'Assessment data may include sessions, responses, timing information, omissions, scores, validity flags, and generated profile outputs.',
  'Administrative and research workflows may generate audit logs and export governance records.',
  'Formal privacy, retention, deletion, and consent controls should be finalised before production launch.',
];

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy"
      title="Privacy policy placeholder."
      description="This page is a development-stage placeholder for IQMeridian’s public privacy policy. It should be reviewed and replaced with a formal legal policy before launch."
    >
      <PublicCard>
        <PublicSectionHeading
          eyebrow="Data handling"
          title="Assessment data requires careful governance."
          description="IQMeridian handles information that may become sensitive because it relates to cognitive assessment, scoring, timing, validity, and user profiles."
        />

        <PublicBulletList items={privacyItems} />
      </PublicCard>
    </PublicPageShell>
  );
}
