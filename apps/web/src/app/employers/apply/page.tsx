import Link from 'next/link';

import { OrganisationAccessRequestForm } from './organisation-access-request-form';

export default function EmployerAccessRequestPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] px-6 py-10 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(2,8,23,1))]"
      />

      <div className="relative mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="block">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
              IQMeridian
            </p>
            <p className="mt-1 text-sm font-black text-white">
              Employer access request
            </p>
          </Link>

          <Link
            href="/login"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-white/[0.07]"
          >
            Sign in
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
          />

          <div className="relative max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Reviewed employer onboarding
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              Apply for controlled employer access.
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
              IQMeridian does not grant immediate assessment administration
              rights to public visitors. Organisations must first submit an
              access request so platform administrators can review legitimacy,
              intended use, candidate volume, and assessment governance.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/88 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              Step 1
            </p>
            <h2 className="mt-3 text-lg font-black text-white">
              Submit organisation details
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Provide the company name, contact person, industry, country, and
              intended assessment use case.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-violet-300/15 bg-[#07142f]/88 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
              Step 2
            </p>
            <h2 className="mt-3 text-lg font-black text-white">
              Platform review
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              IQMeridian reviews whether the request is suitable for employer
              assessment access.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-300/15 bg-[#07142f]/88 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Step 3
            </p>
            <h2 className="mt-3 text-lg font-black text-white">
              Admin provisioning
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Approved organisations can be converted into employer workspaces
              and assigned employer-admin users.
            </p>
          </div>
        </section>

        <OrganisationAccessRequestForm />
      </div>
    </main>
  );
}