import Link from 'next/link';

import { ItemCreationForm } from '../../../_components/item-creation-form';

export default function NewInternalItemPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
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
            Researcher authoring
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Add new item
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            New assessment items should enter the platform through a controlled
            authoring pathway before activation. This prevents unreviewed items
            from becoming live assessment content.
          </p>
        </header>

        <ItemCreationForm />
      </div>
    </main>
  );
}
