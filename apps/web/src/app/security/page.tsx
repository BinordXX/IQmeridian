import {
  PublicBulletList,
  PublicCard,
  PublicMetric,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';

export const metadata = {
  title: 'Security | IQMeridian',
  description: 'IQMeridian security and platform protection overview.',
};

const securityItems = [
  'Role-based access control across consumers, candidates, employers, researchers, and platform administrators.',
  'JWT-backed authentication with refresh-session management.',
  'Audit logging for sensitive authentication, assessment, scoring, export, and internal tooling actions.',
  'Password change workflow with local password verification and session revocation safeguards.',
  'Future security roadmap includes active-session management, user-visible login history, and stronger production hardening.',
];

export default function SecurityPage() {
  return (
    <PublicPageShell
      eyebrow="Security"
      title="Security and governance are part of the assessment product."
      description="IQMeridian handles assessment and score-related information, so the platform must treat identity, access, audit, and data governance as core infrastructure."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <PublicCard>
          <PublicSectionHeading
            eyebrow="Security posture"
            title="Built around controlled access and traceability."
            description="The security model is still being matured, but the product direction already separates user roles, authenticated access, and sensitive internal workflows."
          />

          <PublicBulletList items={securityItems} />
        </PublicCard>

        <div className="grid gap-6">
          <PublicMetric
            description="Role-specific access for assessment, employer, researcher, and admin surfaces."
            label="access model"
            value="RBAC"
          />
          <PublicMetric
            description="Sensitive product actions are designed to leave traceable audit records."
            label="audit layer"
            value="Traceable"
          />
          <PublicMetric
            description="Security features should be strengthened before production launch."
            label="production"
            value="Hardening"
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
