'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  updateInternalItemStatus,
  type InternalItemDetailOutput,
  type UpdateInternalItemStatusInput,
} from '../_lib/internal-api';

type ItemStatus = UpdateInternalItemStatusInput['status'];

export function ItemStatusActionsClient({
  itemId,
  status,
  activeFormAssociationCount,
}: {
  itemId: string;
  status: string;
  activeFormAssociationCount: number;
}) {
  const router = useRouter();

  const [note, setNote] = useState('');
  const [updatedItem, setUpdatedItem] =
    useState<InternalItemDetailOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] =
    useState<ItemStatus | null>(null);

  const isRetired = status === 'RETIRED';
  const isActive = status === 'ACTIVE';
  const isUnderReview = status === 'UNDER_REVIEW';
  const hasActiveMapping = activeFormAssociationCount > 0;

  async function handleStatusChange(nextStatus: ItemStatus) {
    setErrorMessage('');
    setUpdatedItem(null);

    if (nextStatus === 'ACTIVE' && !hasActiveMapping) {
      setErrorMessage(
        'This item cannot be activated because it has no active form mapping.'
      );
      return;
    }

    const confirmed = window.confirm(
      `Set ${itemId} to ${nextStatus}? This status change will be recorded in the audit log.`
    );

    if (!confirmed) {
      return;
    }

    setIsSubmittingStatus(nextStatus);

    try {
      const updated = await updateInternalItemStatus({
        itemId,
        input: {
          status: nextStatus,
          note: note.trim().length > 0 ? note.trim() : null,
        },
      });

      setUpdatedItem(updated);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Item status could not be updated.'
      );
    } finally {
      setIsSubmittingStatus(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Item status actions</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Use this panel to move an item through its operational lifecycle.
          Status changes are explicit and auditable because they affect form
          quality, exposure, comparability, and later performance
          interpretation.
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

      {!hasActiveMapping && !isRetired ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          This item has no active form mapping. It can be drafted or reviewed,
          but it cannot be activated until it is attached to a form.
        </div>
      ) : null}

      {isRetired ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          This item is retired. It cannot be silently reactivated. Create a new
          version instead.
        </div>
      ) : null}

      <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-slate-700">
        Status-change note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Optional internal note explaining the status change."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        {!isRetired && !isUnderReview ? (
          <button
            type="button"
            onClick={() => handleStatusChange('UNDER_REVIEW')}
            disabled={isSubmittingStatus !== null}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {isSubmittingStatus === 'UNDER_REVIEW'
              ? 'Updating...'
              : 'Mark under review'}
          </button>
        ) : null}

        {isUnderReview ? (
          <button
            type="button"
            onClick={() => handleStatusChange('DRAFT')}
            disabled={isSubmittingStatus !== null}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {isSubmittingStatus === 'DRAFT' ? 'Updating...' : 'Return to draft'}
          </button>
        ) : null}

        {!isRetired && !isActive ? (
          <button
            type="button"
            onClick={() => handleStatusChange('ACTIVE')}
            disabled={isSubmittingStatus !== null || !hasActiveMapping}
            className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmittingStatus === 'ACTIVE' ? 'Activating...' : 'Activate'}
          </button>
        ) : null}

        {!isRetired ? (
          <button
            type="button"
            onClick={() => handleStatusChange('RETIRED')}
            disabled={isSubmittingStatus !== null}
            className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:bg-red-50"
          >
            {isSubmittingStatus === 'RETIRED' ? 'Retiring...' : 'Retire item'}
          </button>
        ) : null}

        {!hasActiveMapping && !isRetired ? (
          <Link
            href={`/internal/researcher/item-bank/${encodeURIComponent(
              itemId
            )}/attach-form`}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
          >
            Attach to form
          </Link>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {updatedItem ? (
        <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Item status updated to{' '}
          <span className="font-semibold">{updatedItem.status}</span>. Refresh
          has been requested so the server-rendered metadata reflects the latest
          database state.
        </div>
      ) : null}
    </section>
  );
}
