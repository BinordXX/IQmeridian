'use client';

import { useState } from 'react';

import {
  itemReviewStatusLabels,
  psychometricItemStatusLabels,
  updateInternalItemReviewReadiness,
  type InternalItemDetailOutput,
} from '../_lib/internal-api';

const reviewStatusOptions = [
  'NOT_REVIEWED',
  'REVIEW_IN_PROGRESS',
  'APPROVED_FOR_PILOT',
  'NEEDS_REVISION',
  'REJECTED',
];

const psychometricStatusOptions = [
  'DRAFT',
  'CONTENT_REVIEWED',
  'PILOT_READY',
  'UNDER_REVIEW',
  'FLAGGED_AFTER_PILOT',
  'RETIRED',
  'CALIBRATED',
];

function getReadinessExplanation({
  reviewStatus,
  psychometricStatus,
}: {
  reviewStatus: string;
  psychometricStatus: string;
}) {
  if (
    reviewStatus === 'APPROVED_FOR_PILOT' &&
    psychometricStatus === 'PILOT_READY'
  ) {
    return 'This item is eligible for pilot-form assembly, subject to backend validation.';
  }

  if (reviewStatus !== 'APPROVED_FOR_PILOT') {
    return 'This item has not yet passed content review for pilot use.';
  }

  if (psychometricStatus !== 'PILOT_READY') {
    return 'This item is content-approved but has not yet been marked pilot-ready.';
  }

  return 'Review and readiness status are being tracked separately from operational item status.';
}

export function ItemReviewReadinessClient({
  item,
}: {
  item: InternalItemDetailOutput;
}) {
  const [currentItem, setCurrentItem] = useState(item);
  const [reviewStatus, setReviewStatus] = useState(item.reviewStatus);
  const [psychometricStatus, setPsychometricStatus] = useState(
    item.psychometricStatus
  );
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const explanation = getReadinessExplanation({
    reviewStatus,
    psychometricStatus,
  });

  const isPilotReady =
    currentItem.reviewStatus === 'APPROVED_FOR_PILOT' &&
    currentItem.psychometricStatus === 'PILOT_READY';

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessage('');
    setErrorMessage('');

    try {
      const updatedItem = await updateInternalItemReviewReadiness({
        itemId: currentItem.id,
        input: {
          reviewStatus,
          psychometricStatus,
          note: note.trim().length > 0 ? note.trim() : null,
        },
      });

      setCurrentItem(updatedItem);
      setReviewStatus(updatedItem.reviewStatus);
      setPsychometricStatus(updatedItem.psychometricStatus);
      setNote('');
      setMessage('Review and readiness status updated.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Review/readiness status could not be updated.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div>
        <h2 className="text-xl font-black text-white">
          Review and readiness actions
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-400">
          Use this panel to control whether the item has passed content review
          and whether it is ready for pilot-form assembly. This is separate from
          the operational item status.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
          <p className="text-sm text-slate-500">Current content review</p>
          <p className="mt-1 text-sm font-black text-white">
            {itemReviewStatusLabels[currentItem.reviewStatus] ??
              currentItem.reviewStatus}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
          <p className="text-sm text-slate-500">Current readiness</p>
          <p className="mt-1 text-sm font-black text-white">
            {psychometricItemStatusLabels[currentItem.psychometricStatus] ??
              currentItem.psychometricStatus}
          </p>
        </div>
      </div>

      <div
        className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold leading-7 ${
          isPilotReady
            ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
            : 'border-amber-300/20 bg-amber-400/10 text-amber-100'
        }`}
      >
        {isPilotReady
          ? 'This item is currently pilot-ready.'
          : 'This item is not currently pilot-ready.'}
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold leading-7 text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
          Content review status
          <select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value)}
            className="min-h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
          >
            {reviewStatusOptions.map((status) => (
              <option key={status} value={status}>
                {itemReviewStatusLabels[status] ?? status}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
          Psychometric readiness status
          <select
            value={psychometricStatus}
            onChange={(event) => setPsychometricStatus(event.target.value)}
            className="min-h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
          >
            {psychometricStatusOptions.map((status) => (
              <option key={status} value={status}>
                {psychometricItemStatusLabels[status] ?? status}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3 text-sm leading-7 text-slate-400">
          {explanation}
        </div>

        <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
          Review/readiness note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="Add an internal note explaining the review or readiness decision."
            className="rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-5 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Updating...' : 'Update review/readiness'}
        </button>
      </div>
    </section>
  );
}
