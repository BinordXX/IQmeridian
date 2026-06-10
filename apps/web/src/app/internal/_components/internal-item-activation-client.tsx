'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  activateInternalItem,
  type InternalItemDetailOutput,
} from '../_lib/internal-api';

export function InternalItemActivationClient({
  itemId,
  status,
  activeFormAssociationCount,
}: {
  itemId: string;
  status: string;
  activeFormAssociationCount: number;
}) {
  const [note, setNote] = useState('');
  const [activatedItem, setActivatedItem] =
    useState<InternalItemDetailOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAlreadyActive = status === 'ACTIVE';
  const cannotActivate = activeFormAssociationCount === 0 || isAlreadyActive;

  async function handleActivateItem() {
    setErrorMessage('');
    setActivatedItem(null);
    setIsSubmitting(true);

    try {
      const activated = await activateInternalItem({
        itemId,
        input: {
          note: note.trim().length > 0 ? note.trim() : null,
        },
      });

      setActivatedItem(activated);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Item could not be activated.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Activation action</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Activating an item makes it operationally available. The item must
          already be attached to at least one active form mapping. Retired items
          should not be silently reactivated; create a new version instead.
        </p>
      </div>

      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-slate-500">Current status</dt>
          <dd className="mt-1 font-semibold">{status}</dd>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-slate-500">Active form associations</dt>
          <dd className="mt-1 font-semibold">{activeFormAssociationCount}</dd>
        </div>
      </dl>

      {activeFormAssociationCount === 0 ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          This item cannot be activated yet because it has no active form
          mapping. Attach it to a form first.
        </div>
      ) : null}

      {isAlreadyActive ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          This item is already active.
        </div>
      ) : null}

      <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-slate-700">
        Activation note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Optional internal note explaining why this item is being activated."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleActivateItem}
          disabled={cannotActivate || isSubmitting}
          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? 'Activating item...' : 'Activate item'}
        </button>

        <Link
          href={`/internal/researcher/item-bank/${encodeURIComponent(
            itemId
          )}/attach-form`}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          Attach to form
        </Link>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {activatedItem ? (
        <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Item activated successfully. Current status:{' '}
          <span className="font-semibold">{activatedItem.status}</span>. Refresh
          the page to see the updated server-rendered metadata.
        </div>
      ) : null}
    </section>
  );
}
