export default function EmployerAccessDeniedPage() {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
        Employer access restricted
      </p>

      <h2 className="mt-3 text-2xl font-bold text-amber-950">
        This employer workspace cannot be opened
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-900">
        The campaign or dashboard data could not be loaded for this employer
        account. Confirm that the API server is running, the employer account is
        authorised, and the requested campaign belongs to the employer
        organisation.
      </p>
    </section>
  );
}
