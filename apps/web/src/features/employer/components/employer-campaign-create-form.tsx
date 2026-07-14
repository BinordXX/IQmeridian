'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { EmployerAssessmentFormSummary } from '../api/employer-dashboard-api';

type EmployerCampaignCreateFormProps = {
  activeForms: EmployerAssessmentFormSummary[];
  organisationId: string;
};

type CreatedEmployerCampaign = {
  id: string;
  name: string;
  status: string;
};

const createEmployerCampaignFromClient = async (input: {
  name: string;
  organisationId: string;
  assessmentFormId?: string;
}) => {
  const response = await fetch('/api/employer/campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

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
        `Campaign creation failed with status ${response.status}`
    );
  }

  return payload as CreatedEmployerCampaign;
};

export const EmployerCampaignCreateForm = ({
  activeForms,
  organisationId,
}: EmployerCampaignCreateFormProps) => {
  const router = useRouter();

  const [name, setName] = useState('');
  const [roleContext, setRoleContext] = useState('');
  const [assessmentFormId, setAssessmentFormId] = useState(
    activeForms[0]?.id ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasActiveForms = activeForms.length > 0;
  const selectedFormExists = activeForms.some((form) => {
    return form.id === assessmentFormId;
  });

  const submitCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Enter a campaign name before creating this campaign.');
      return;
    }

    if (!assessmentFormId || !hasActiveForms || !selectedFormExists) {
      setErrorMessage(
        'Select a valid active assessment form before creating this campaign.'
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const campaignName = roleContext.trim()
        ? `${name.trim()} — ${roleContext.trim()}`
        : name.trim();

      await createEmployerCampaignFromClient({
        name: campaignName,
        organisationId,
        assessmentFormId,
      });

      router.push('/employer/campaigns');
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The campaign could not be created.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={submitCampaign}
      className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
      />

      <div className="relative space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Create campaign
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            New employer campaign
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
            Create a campaign linked to an active assessment form. The backend
            creates campaigns in the default initial state; status changes are
            handled after creation.
          </p>
        </div>

        <div>
          <label
            htmlFor="campaign-name"
            className="text-sm font-black text-slate-300"
          >
            Campaign name
          </label>

          <input
            id="campaign-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            placeholder="Graduate Analyst Screening"
            required
          />
        </div>

        <div>
          <label
            htmlFor="role-context"
            className="text-sm font-black text-slate-300"
          >
            Role or assessment context
          </label>

          <input
            id="role-context"
            type="text"
            value={roleContext}
            onChange={(event) => setRoleContext(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            placeholder="Entry-level analyst, internship intake, technical hiring"
          />

          <p className="mt-2 text-xs leading-5 text-slate-500">
            For the current MVP backend, this context is appended to the
            campaign name rather than stored as a separate campaign field.
          </p>
        </div>

        {!hasActiveForms ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            No active assessment forms are currently available. A campaign
            cannot be created until an active assessment form exists.
          </div>
        ) : null}

        <div>
          <label
            htmlFor="assessment-form"
            className="text-sm font-black text-slate-300"
          >
            Active assessment form
          </label>

          <select
            id="assessment-form"
            value={assessmentFormId}
            onChange={(event) => setAssessmentFormId(event.currentTarget.value)}
            disabled={!hasActiveForms}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40 disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-slate-600"
            required
          >
            {activeForms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name}
                {form.version ? ` v${form.version}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-100">
          Campaign status starts from the backend default state. Activate or
          close the campaign from the edit screen after creation, following the
          backend transition rules.
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={
              isSaving ||
              !name.trim() ||
              !assessmentFormId ||
              !hasActiveForms ||
              !selectedFormExists
            }
            className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
          >
            {isSaving ? 'Creating campaign...' : 'Create campaign'}
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
