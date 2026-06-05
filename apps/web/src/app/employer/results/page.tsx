import Link from 'next/link';

export default function EmployerResultsPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Results
      </p>

      <h2 className="mt-3 text-3xl font-bold text-slate-950">
        Campaign result review
      </h2>

      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
        Employer result review is handled inside each campaign so that
        comparison, report access, and interpretation remain within the relevant
        hiring context.
      </p>

      <Link
        href="/employer/campaigns"
        className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Review campaign results
      </Link>
    </section>
  );
}
