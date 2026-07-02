'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';


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
        `Campaign creation failed with status ${response.status}`,
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
      : 'The campaign could not be created.',
  );
}
  };

  return (
    <form
      onSubmit={submitCampaign}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Create campaign
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          New employer campaign
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Create a simple MVP campaign linked to an active assessment form. The
          backend creates campaigns in its default initial state; status changes
          are handled after creation.
        </p>
      </div>

      <div>
        <label
          htmlFor="campaign-name"
          className="text-sm font-medium text-slate-700"
        >
          Campaign name
        </label>

        <input
          id="campaign-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
          placeholder="Graduate Analyst Screening"
          required
        />
      </div>

      <div>
        <label
          htmlFor="role-context"
          className="text-sm font-medium text-slate-700"
        >
          Role or assessment context
        </label>

        <input
          id="role-context"
          type="text"
          value={roleContext}
          onChange={(event) => setRoleContext(event.currentTarget.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
          placeholder="Entry-level analyst, internship intake, technical hiring"
        />

        <p className="mt-2 text-xs leading-5 text-slate-500">
          For the current MVP backend, this context is appended to the campaign
          name rather than stored as a separate campaign field.
        </p>
      </div>

      {!hasActiveForms ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          No active assessment forms are currently available. A campaign cannot
          be created until an active assessment form exists.
        </div>
      ) : null}

      <div>
        <label
          htmlFor="assessment-form"
          className="text-sm font-medium text-slate-700"
        >
          Active assessment form
        </label>

        <select
          id="assessment-form"
          value={assessmentFormId}
          onChange={(event) => setAssessmentFormId(event.currentTarget.value)}
          disabled={!hasActiveForms}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        Campaign status starts from the backend default state. Activate or close
        the campaign from the edit screen after creation, following the backend
        transition rules.
      </div>

      {errorMessage ? (
        <p className="text-sm font-medium text-red-700">{errorMessage}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={
            isSaving ||
            !name.trim() ||
            !assessmentFormId ||
            !hasActiveForms ||
            !selectedFormExists
          }
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? 'Creating campaign...' : 'Create campaign'}
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
