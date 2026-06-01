export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <header className="mb-6 border-b border-slate-800 pb-4">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
            IQMeridian Assessment
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Candidate Assessment Experience
          </h1>
        </header>

        <section className="flex-1">{children}</section>
      </div>
    </main>
  );
}