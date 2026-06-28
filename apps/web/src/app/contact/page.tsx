import {
  PublicCard,
  PublicPageShell,
  PublicSectionHeading,
} from '../_components/public-page-shell';

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
        </div>

        <PublicCard>
          <PublicSectionHeading
            eyebrow="Message"
            title="Contact form placeholder."
            description="The form interface is ready as a public-site placeholder. A backend message workflow can be connected in a later part."
          />

          <form className="mt-8 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-300">
                  Full name
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
                  placeholder="Your name"
                  type="text"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-300">
                  Email
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
                  placeholder="you@example.com"
                  type="email"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Enquiry type
              </span>
              <select className="mt-2 w-full rounded-2xl border border-white/10 bg-[#07142f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/50">
                <option>Product enquiry</option>
                <option>Employer partnership</option>
                <option>Research collaboration</option>
                <option>Governance / privacy</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Message
              </span>
              <textarea
                className="mt-2 min-h-36 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
                placeholder="Tell us what you want to discuss."
              />
            </label>

            <button
              className="w-fit cursor-not-allowed rounded-full border border-cyan-300/20 bg-cyan-400/10 px-6 py-3 text-sm font-black text-cyan-100 opacity-80"
              disabled
              type="button"
            >
              Contact endpoint coming soon
            </button>
          </form>
        </PublicCard>
      </div>
    </PublicPageShell>
  );
}