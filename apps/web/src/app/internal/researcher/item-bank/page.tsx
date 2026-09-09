import Link from 'next/link';

import { ItemBankManagementClient } from '../../_components/item-bank-management-client';
import { fetchInternalItems } from '../../_lib/internal-api';

export default async function InternalItemBankPage() {
  const items = await fetchInternalItems();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/internal"
          className="font-bold text-slate-500 underline-offset-4 hover:text-cyan-200 hover:underline"
        >
          Internal dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <span className="font-black text-slate-300">Researcher item bank</span>
      </nav>

      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Researcher tooling
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Central item-management screen
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This page reads item records from the internal API rather than from
            frontend mock data.
          </p>
        </div>
      </header>

      <ItemBankManagementClient items={items} />
    </div>
  );
}
