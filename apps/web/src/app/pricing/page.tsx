import Link from 'next/link';
import {
  PublicBulletList,
  PublicCard,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';

export const metadata = {
  title: 'IQMeridian Pricing',
  description: 'IQMeridian pricing and plan placeholders.',
};

const plans = [
  {
    name: 'Individual',
    price: 'Free preview',
    description:
      'For users exploring IQMeridian assessment access and profile dashboards during the MVP stage.',
    features: [
      'Consumer registration and login',
      'Assessment workspace',
      'Completed attempt history',
      'Provisional score profile',
    ],
    cta: 'Create account',
    href: '/register',
  },
  {
    name: 'Employer',
    price: 'Contact sales',
    description:
      'For organisations preparing candidate assessment campaigns and future structured intelligence reporting.',
    features: [
      'Employer workspace',
      'Candidate invitation workflows',
      'Campaign-level assessment visibility',
      'Future employer reporting controls',
    ],
    cta: 'Contact us',
    href: '/contact',
  },
  {
    name: 'Research',
    price: 'Governed access',
    description:
      'For internal researchers and validation work requiring controlled item, session, response, and export access.',
    features: [
      'Researcher workspace',
      'Item performance review',
      'Suspicious-session analysis',
      'Export request governance',
    ],
    cta: 'Review governance',
    href: '/research-governance',
  },
];

export default function PricingPage() {
  return (
    <PublicPageShell
      eyebrow="Pricing"
      title="Plans for individuals, employers, and research workflows."
      description="Pricing is currently presented as a public placeholder while IQMeridian remains in MVP development. Commercial plans should be finalised after calibration, reporting governance, and employer-readiness validation."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <PublicCard className="flex flex-col" key={plan.name}>
            <h2 className="text-2xl font-black text-white">{plan.name}</h2>
            <p className="mt-3 text-3xl font-black text-cyan-200">
              {plan.price}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              {plan.description}
            </p>

            <PublicBulletList items={plan.features} />

            <Link
              className="mt-8 inline-flex w-fit rounded-full border border-cyan-300/30 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
              href={plan.href}
            >
              {plan.cta}
            </Link>
          </PublicCard>
        ))}
      </div>

      <PublicCard className="mt-6">
        <PublicSectionHeading
          eyebrow="Commercial readiness"
          title="High-stakes use requires validation first."
          description="IQMeridian should not be positioned as a certified hiring or clinical decision system until norming, calibration, reliability validation, fairness review, and report governance are complete."
        />
      </PublicCard>
    </PublicPageShell>
  );
}