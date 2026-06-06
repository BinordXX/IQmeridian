import Link from 'next/link';

import { ItemDraftEditClient } from '../../../_components/item-draft-edit-client';

export default async function EditInternalItemPage({
  searchParams,
}: {
  searchParams?: Promise<{
    itemId?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const itemIdParam = resolvedSearchParams?.itemId;
  const initialItemId = Array.isArray(itemIdParam)
    ? itemIdParam[0]
    : itemIdParam;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
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
          <span className="font-semibold text-slate-950">Edit draft</span>
        </nav>

        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Draft-stage control
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Edit item before activation
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Draft items can be revised before they enter a live assessment
            context. Once an item becomes historically active, future changes
            should create a versioned successor rather than silently altering
            the original item.
          </p>
        </header>

        <ItemDraftEditClient initialItemId={initialItemId} />
      </div>
    </main>
  );
}
