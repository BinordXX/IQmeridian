export default function EmployerLoading() {
  return (
    <main className="min-h-screen bg-[#020817] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
          />

          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Employer workspace
            </p>

            <h1 className="mt-3 text-3xl font-black text-white">
              Loading workspace
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Preparing campaigns, participants, reports, and employer controls.
            </p>

            <div className="mt-6 h-2 w-56 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-cyan-300/60" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}