import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ItemAttachFormClient } from '../../../../_components/item-attach-form-client';
import { fetchInternalItemById } from '../../../../_lib/internal-api';

export default async function InternalAttachItemToFormPage({
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
        <span className="font-semibold text-slate-950">Attach to form</span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Item placement
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Attach item to assessment form
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Attach <span className="font-semibold">{item.id}</span> to a form and
          section so it can be used operationally and tracked through exposure,
          sessions, responses, and performance analytics.
        </p>
      </header>

      <ItemAttachFormClient itemId={decodedItemId} />
    </div>
  );
}
