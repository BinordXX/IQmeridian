'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import {
  updateEmployerCampaignStatus,
  type EmployerCampaignSummary,
} from '../api/employer-dashboard-api';

type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

type EmployerCampaignStatusFormProps = {
  campaign: EmployerCampaignSummary;
};

const getAllowedNextStatuses = (status: string): CampaignStatus[] => {
  switch (status) {
    case 'DRAFT':
      return ['ACTIVE', 'ARCHIVED'];

    case 'ACTIVE':
      return ['CLOSED', 'ARCHIVED'];

    case 'CLOSED':
      return ['ARCHIVED'];

    default:
      return [];
  }
};

export const EmployerCampaignStatusForm = ({
  campaign,
}: EmployerCampaignStatusFormProps) => {
  const router = useRouter();
  const allowedStatuses = getAllowedNextStatuses(campaign.status);

  const [status, setStatus] = useState<CampaignStatus | ''>(
    allowedStatuses[0] ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!status || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateEmployerCampaignStatus(campaign.id, { status });
      router.push('/employer/campaigns');
      router.refresh();
    } catch {
      setErrorMessage(
        'The campaign status could not be updated. Confirm that the requested transition is permitted.'
      );
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={submitStatus}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Edit campaign
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          {campaign.name}
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          The current MVP backend permits status transitions only. Campaign name
          and assessment assignment are locked here to avoid implying edits that
          the backend does not yet support.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-500">Current status</p>
          <p className="mt-2 text-xl font-bold text-slate-950">
            {campaign.status}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <p className="text-sm font-medium text-slate-500">Assessment form</p>
          <p className="mt-2 text-xl font-bold text-slate-950">
            {campaign.assessmentForm?.name ??
              campaign.assessmentFormId ??
              'No assessment form assigned'}
          </p>
        </div>
      </div>

      {allowedStatuses.length > 0 ? (
        <div>
          <label
            htmlFor="campaign-status"
            className="text-sm font-medium text-slate-700"
          >
            New status
          </label>

          <select
            id="campaign-status"
            value={status}
            onChange={(event) =>
              setStatus(event.currentTarget.value as CampaignStatus)
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
            required
          >
            {allowedStatuses.map((allowedStatus) => (
              <option key={allowedStatus} value={allowedStatus}>
                {allowedStatus}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This campaign has no permitted status transitions from its current
          state.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        Assessment assignment should not be changed casually after candidates
        have been invited or tested. The MVP currently restricts editing to
        backend-approved status transitions only.
      </div>

      {errorMessage ? (
        <p className="text-sm font-medium text-red-700">{errorMessage}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving || !status}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? 'Updating campaign...' : 'Update status'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/employer/campaigns')}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
