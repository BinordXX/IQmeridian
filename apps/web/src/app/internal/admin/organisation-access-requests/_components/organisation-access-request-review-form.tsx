'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

type ReviewStatus = 'APPROVED' | 'DECLINED';

type OrganisationAccessRequestReviewFormProps = {
  requestId: string;
  currentStatus: string;
};

const getErrorMessage = (payload: {
  message?: string | string[];
  error?: string;
}) => {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }

  return payload.message ?? payload.error ?? 'The review could not be saved.';
};

export function OrganisationAccessRequestReviewForm({
  requestId,
  currentStatus,
}: OrganisationAccessRequestReviewFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ReviewStatus>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConverted = currentStatus === 'CONVERTED';

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving || isConverted) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/internal/organisation-access-requests/${encodeURIComponent(
          requestId,
        )}/review`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            reviewNotes: reviewNotes.trim() || undefined,
          }),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string | string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      setReviewNotes('');
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The review could not be saved.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isConverted) {
    return (
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-100">
        This request has already been converted into an organisation. Further
        review changes are disabled.
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
      onSubmit={submitReview}
    >
      <div className="grid gap-4 md:grid-cols-[14rem_1fr_auto] md:items-end">
        <div>
          <label
            className="text-xs font-black uppercase tracking-[0.18em] text-slate-500"
            htmlFor={`review-status-${requestId}`}
          >
            Decision
          </label>
          <select
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-black text-white outline-none focus:border-cyan-300/40"
            id={`review-status-${requestId}`}
            onChange={(event) => setStatus(event.currentTarget.value as ReviewStatus)}
            value={status}
          >
            <option value="APPROVED">Approve</option>
            <option value="DECLINED">Decline</option>
          </select>
        </div>

        <div>
          <label
            className="text-xs font-black uppercase tracking-[0.18em] text-slate-500"
            htmlFor={`review-notes-${requestId}`}
          >
            Review notes
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            id={`review-notes-${requestId}`}
            onChange={(event) => setReviewNotes(event.currentTarget.value)}
            placeholder="Optional admin note"
            value={reviewNotes}
          />
        </div>

        <button
          className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? 'Saving...' : 'Save review'}
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
          {errorMessage}
        </div>
      ) : null}
    </form>
  );
}