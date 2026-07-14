'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { EmployerCampaignSummary } from '../api/employer-dashboard-api';

type UpdatedEmployerCampaign = {
  id: string;
  name: string;
  status: string;
};

const updateEmployerCampaignStatusFromClient = async (
  campaignId: string,
  input: {
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  }
) => {
  const response = await fetch(
    `/api/employer/campaigns/${encodeURIComponent(campaignId)}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  );

  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    status?: string;
    message?: string | string[];
    error?: string;
  };

  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(' ')
      : payload.message;

    throw new Error(
      message ??
        payload.error ??
        `Campaign status update failed with status ${response.status}`
    );
  }

  return payload as UpdatedEmployerCampaign;
};

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
      await updateEmployerCampaignStatusFromClient(campaign.id, { status });
      router.push('/employer/campaigns');
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The campaign status could not be updated.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={submitStatus}
      className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
      />

      <div className="relative space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Edit campaign
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            {campaign.name}
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
            The current MVP backend permits status transitions only. Campaign
            name and assessment assignment are locked here to avoid implying
            edits that the backend does not yet support.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              Current status
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {campaign.status}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Assessment form
            </p>
            <p className="mt-2 text-xl font-black text-slate-200">
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
              className="text-sm font-black text-slate-300"
            >
              New status
            </label>

            <select
              id="campaign-status"
              value={status}
              onChange={(event) =>
                setStatus(event.currentTarget.value as CampaignStatus)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
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
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            This campaign has no permitted status transitions from its current
            state.
          </div>
        )}

        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-100">
          Assessment assignment should not be changed casually after candidates
          have been invited or tested. The MVP currently restricts editing to
          backend-approved status transitions only.
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSaving || !status}
            className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
          >
            {isSaving ? 'Updating campaign...' : 'Update status'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/employer/campaigns')}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/[0.07]"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};
