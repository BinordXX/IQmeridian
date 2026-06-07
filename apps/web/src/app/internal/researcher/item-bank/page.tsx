import Link from 'next/link';

import { ItemBankManagementClient } from '../../_components/item-bank-management-client';
import { fetchInternalItems } from '../../_lib/internal-api';

export default async function InternalItemBankPage() {
  const items = await fetchInternalItems();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/internal" className="font-medium text-slate-600">
          Internal dashboard
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-950">
          Researcher item bank
        </span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Researcher tooling
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Central item-management screen
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This page now reads item records from the internal API rather than
          from frontend mock data.
        </p>
      </header>

      <ItemBankManagementClient items={items} />
    </div>
  );
}
