import {
  PublicBulletList,
  PublicCard,
  PublicMetric,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';

export const metadata = {
  title: 'API | IQMeridian',
  description: 'IQMeridian API and developer platform direction.',
};

const apiCapabilities = [
  'Authentication and role-aware access',
  'Assessment invitation and session workflows',
  'Score retrieval and report-readiness endpoints',
  'Employer and research integrations',
  'Governed exports and audit-aware data access',
];

export default function ApiPage() {
  return (
    <PublicPageShell
      eyebrow="API"
      title="A future developer surface for assessment and intelligence workflows."
      description="The IQMeridian API page is a public placeholder for developer documentation, integration capabilities, authentication guidance, and enterprise API access."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <PublicCard>
          <PublicSectionHeading
            eyebrow="Developer platform"
            title="Built for controlled integration, not uncontrolled score extraction."
            description="The API direction should support employer, research, and administrative workflows while respecting access control, privacy, auditability, and interpretation boundaries."
          />

          <PublicBulletList items={apiCapabilities} />
        </PublicCard>

        <PublicCard>
          <div className="rounded-[1.5rem] border border-white/10 bg-[#07142f] p-5 font-mono text-xs text-slate-300">
            <p className="text-cyan-300">POST /auth/login</p>
            <p className="mt-3 text-cyan-300">
              POST /sessions/:sessionId/finalise
            </p>
            <p className="mt-3 text-cyan-300">
              GET /sessions/:sessionId/psychometric-score
            </p>
            <p className="mt-3 text-cyan-300">
              POST /internal/psychometrics/sessions/:sessionId/score
            </p>
            <p className="mt-6 text-slate-500">
              API documentation, SDK examples, scopes, and rate limits will be
              formalised after the integration model is stable.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <PublicMetric
              description="API access should be role-aware and scoped."
              label="access"
              value="RBAC"
            />
            <PublicMetric
              description="Sensitive operations should remain traceable."
              label="governance"
              value="Audit"
            />
          </div>
        </PublicCard>
      </div>
    </PublicPageShell>
  );
}
