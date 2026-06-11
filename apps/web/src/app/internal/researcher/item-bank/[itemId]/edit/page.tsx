import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ItemEditClient } from '../../../../_components/item-edit-client';
import { fetchInternalItemById } from '../../../../_lib/internal-api';

export default async function InternalEditItemPage({
  params,
}: {
  params: Promise<{
    itemId: string;
  }>;
}) {
  const { itemId } = await params;
  const decodedItemId = decodeURIComponent(itemId);

  const item = await fetchInternalItemById(decodedItemId)
    .then((record) => record)
    .catch(() => null);

  if (!item) {
    notFound();
  }

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
        <Link
          href={`/internal/researcher/item-bank/${encodeURIComponent(
            decodedItemId
          )}`}
          className="font-medium text-slate-600"
        >
          {decodedItemId}
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-950">Edit</span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Draft item editing
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Edit item
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Edit the draft version of{' '}
          <span className="font-semibold">{item.id}</span>. Only draft items are
          editable through this workflow.
        </p>
      </header>

      <ItemEditClient item={item} />
    </div>
  );
}
