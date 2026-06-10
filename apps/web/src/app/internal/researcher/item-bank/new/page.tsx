import Link from 'next/link';

import { ItemDraftCreateClient } from '../../../_components/item-draft-create-client';

export default function InternalNewItemPage() {
  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/internal" className="font-medium text-slate-600">
          Internal dashboard
        </Link>
        <span className="text-slate-400">/</span>
        <Link
          href="/internal/researcher/item-bank"
          className="font-medium text-slate-600"
        >
          Item bank
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-950">Create item</span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Researcher tooling
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Add a new draft item
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          New items are created as drafts first. Activation should remain a
          separate auditable action because live item use affects assessment
          comparability and later performance interpretation.
        </p>
      </header>

      <ItemDraftCreateClient />
    </div>
  );
}
