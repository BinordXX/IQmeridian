import Link from 'next/link';

import { PilotFormManagementClient } from '../../_components/pilot-form-management-client';
import { fetchInternalPilotForms } from '../../_lib/internal-api';

export default async function ResearcherPilotFormsPage() {
  const forms = await fetchInternalPilotForms();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-white sm:px-6 sm:py-8">
      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Researcher tooling
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              Pilot forms
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Create, inspect, validate, lock, and activate the formal
              IQMeridian pilot form. This interface exposes backend governance
              for pilot readiness and form-version traceability.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/internal/researcher/item-bank"
              className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
            >
              Item bank
            </Link>

            <Link
              href="/internal/researcher/performance"
              className="rounded-full border border-white/10 bg-[#020817]/70 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
            >
              Performance
            </Link>
          </div>
        </div>
      </header>

      <PilotFormManagementClient initialForms={forms} />
    </main>
  );
}
