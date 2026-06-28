import {
  PublicCard,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';
import { ContactForm } from './_components/contact-form';

export const metadata = {
  title: 'Contact IQMeridian',
  description: 'Contact IQMeridian for product, employer, or research enquiries.',
};

const contactRoutes = [
  {
    title: 'Product enquiries',
    description:
      'For general questions about IQMeridian, candidate accounts, and product access.',
  },
  {
    title: 'Employer partnerships',
    description:
      'For organisations interested in future campaign, invitation, and hiring-intelligence workflows.',
  },
  {
    title: 'Research and governance',
    description:
      'For psychometric research, calibration, item analysis, validation, and data-governance enquiries.',
  },
];

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Contact"
      title="Talk to IQMeridian."
      description="Use this page as the public contact surface for product enquiries, employer interest, research collaboration, and future governance discussions."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-6">
          {contactRoutes.map((route) => (
            <PublicCard key={route.title}>
              <h2 className="text-xl font-black text-white">{route.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {route.description}
              </p>
            </PublicCard>
          ))}

          <PublicCard>
            <PublicSectionHeading
              eyebrow="Routing"
              title="Messages are stored first."
              description="This implementation stores contact enquiries in the platform database. Email notification, admin review queues, and CRM-style workflows can be layered on next."
            />
          </PublicCard>
        </div>

        <ContactForm />
      </div>
    </PublicPageShell>
  );
}