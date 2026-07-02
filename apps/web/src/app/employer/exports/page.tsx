import { Download, FileDown, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function EmployerExportsPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Exports
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
              Campaign exports
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
              Export actions are available inside campaign workspaces and
              candidate report pages so that exported data remains tied to
              authorised campaign access.
            </p>
          </div>

          <Link
            href="/employer/campaigns"
            className="inline-flex w-fit items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
          >
            Open campaign exports
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/88 p-5">
          <FileDown className="text-cyan-200" size={22} />
          <h2 className="mt-4 text-lg font-black text-white">
            CSV campaign tables
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Candidate and campaign tables can be exported from the specific
            campaign workspace.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-violet-300/15 bg-[#07142f]/88 p-5">
          <Download className="text-violet-200" size={22} />
          <h2 className="mt-4 text-lg font-black text-white">
            Report downloads
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Candidate reports are downloaded from authorised report pages.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-emerald-300/15 bg-[#07142f]/88 p-5">
          <ShieldCheck className="text-emerald-200" size={22} />
          <h2 className="mt-4 text-lg font-black text-white">
            Governed access
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Export availability remains tied to employer authorisation and
            campaign scope.
          </p>
        </div>
      </section>
    </div>
  );
}