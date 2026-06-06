export default function InternalUnavailablePage() {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
        Internal access unavailable
      </p>

      <h2 className="mt-3 text-2xl font-bold text-amber-950">
        This internal workspace could not be loaded
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-900">
        Confirm that the API server is running and that the internal tooling
        token has the correct platform-admin or researcher permissions.
      </p>
    </section>
  );
}
