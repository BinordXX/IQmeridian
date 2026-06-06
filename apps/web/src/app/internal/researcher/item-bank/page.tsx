import Link from 'next/link';

import { ItemBankManagementClient } from '../../_components/item-bank-management-client';

export default function InternalItemBankPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
            This page gives authorised internal users a controlled view of all
            assessment items, including domain, status, activation history,
            review signals, and draft-stage editability.
          </p>
        </header>

        <ItemBankManagementClient />
      </div>
    </main>
  );
}
