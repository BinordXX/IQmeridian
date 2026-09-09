'use client';

import { useMemo, useState } from 'react';

import {
  createFormalPilotForm,
  itemDomainLabels,
  pilotFormStatusLabels,
  updatePilotFormStatus,
  type InternalPilotFormBlueprintValidationOutput,
  type InternalPilotFormOutput,
} from '../_lib/internal-api';

const statusOptions = [
  'DRAFT',
  'READY_FOR_REVIEW',
  'LOCKED_FOR_PILOT',
  'ACTIVE_PILOT',
  'CLOSED',
  'ARCHIVED',
];

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'dark';

const badgeToneClasses: Record<BadgeTone, string> = {
  neutral: 'border-white/10 bg-[#020817]/70 text-slate-300',
  success: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
  warning: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
  danger: 'border-red-300/20 bg-red-400/10 text-red-100',
  dark: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100',
};

function getPilotStatusTone(status: string): BadgeTone {
  if (status === 'ACTIVE_PILOT') return 'success';
  if (status === 'LOCKED_FOR_PILOT') return 'dark';
  if (status === 'READY_FOR_REVIEW') return 'warning';
  if (status === 'CLOSED' || status === 'ARCHIVED') return 'neutral';

  return 'neutral';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        badgeToneClasses[getPilotStatusTone(status)]
      }`}
    >
      {pilotFormStatusLabels[status] ?? status}
    </span>
  );
}

function ValidationBadge({
  validation,
}: {
  validation: InternalPilotFormBlueprintValidationOutput;
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        validation.isValid ? badgeToneClasses.success : badgeToneClasses.danger
      }`}
    >
      {validation.isValid ? 'Blueprint valid' : 'Blueprint incomplete'}
    </span>
  );
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  return JSON.stringify(value, null, 2);
}

function BlueprintTable({
  validation,
}: {
  validation: InternalPilotFormBlueprintValidationOutput;
}) {
  const rows = Object.entries(validation.expectedBlueprint);

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-[#020817]/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Domain</th>
            <th className="px-4 py-3">Expected</th>
            <th className="px-4 py-3">Current active items</th>
            <th className="px-4 py-3">Gap</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/10 bg-[#020817]/45">
          {rows.map(([domain, expected]) => {
            const actual = validation.actualBlueprint[domain] ?? 0;
            const gap = actual - expected;

            return (
              <tr key={domain}>
                <td className="px-4 py-3 font-black text-white">
                  {itemDomainLabels[domain] ?? domain}
                </td>

                <td className="px-4 py-3 text-slate-300">{expected}</td>

                <td className="px-4 py-3 text-slate-300">{actual}</td>

                <td
                  className={`px-4 py-3 font-black ${
                    gap === 0 ? 'text-emerald-100' : 'text-red-100'
                  }`}
                >
                  {gap === 0 ? 'OK' : gap > 0 ? `+${gap}` : `${gap}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PilotFormManagementClient({
  initialForms,
}: {
  initialForms: InternalPilotFormOutput[];
}) {
  const [forms, setForms] = useState(initialForms);
  const [selectedFormId, setSelectedFormId] = useState(
    initialForms[0]?.id ?? ''
  );
  const [selectedStatus, setSelectedStatus] = useState(
    initialForms[0]?.pilotStatus ?? 'DRAFT'
  );
  const [overrideReason, setOverrideReason] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const selectedForm = useMemo(
    () => forms.find((form) => form.id === selectedFormId) ?? null,
    [forms, selectedFormId]
  );

  function replaceForm(updatedForm: InternalPilotFormOutput) {
    setForms((currentForms) => {
      const exists = currentForms.some((form) => form.id === updatedForm.id);

      if (!exists) {
        return [updatedForm, ...currentForms];
      }

      return currentForms.map((form) =>
        form.id === updatedForm.id ? updatedForm : form
      );
    });

    setSelectedFormId(updatedForm.id);
    setSelectedStatus(updatedForm.pilotStatus);
  }

  async function handleCreateFormalPilotForm() {
    setIsCreating(true);
    setMessage('');
    setErrorMessage('');

    try {
      const form = await createFormalPilotForm();
      replaceForm(form);
      setMessage('Formal pilot form is available.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Formal pilot form could not be created.'
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStatusUpdate() {
    if (!selectedForm) {
      return;
    }

    setIsUpdatingStatus(true);
    setMessage('');
    setErrorMessage('');

    try {
      const updatedForm = await updatePilotFormStatus({
        formId: selectedForm.id,
        input: {
          status: selectedStatus,
          overrideReason:
            overrideReason.trim().length > 0 ? overrideReason.trim() : null,
        },
      });

      replaceForm(updatedForm);
      setOverrideReason('');
      setMessage('Pilot form status updated.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Pilot form status could not be updated.'
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function handleSelectedFormChange(formId: string) {
    const nextForm = forms.find((form) => form.id === formId) ?? null;

    setSelectedFormId(formId);
    setSelectedStatus(nextForm?.pilotStatus ?? 'DRAFT');
    setOverrideReason('');
    setMessage('');
    setErrorMessage('');
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-white">
              Pilot form governance
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
              Manage the named IQMeridian pilot form, inspect domain blueprint
              readiness, and control pilot status transitions. Backend rules
              still decide whether lock or activation is allowed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleCreateFormalPilotForm()}
            disabled={isCreating}
            className="w-fit rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create/fetch formal pilot form'}
          </button>
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

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
            Select pilot form
            <select
              value={selectedFormId}
              onChange={(event) => handleSelectedFormChange(event.target.value)}
              className="min-h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
            >
              <option value="">No pilot form selected</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name} {form.versionLabel ?? `v${form.version}`} —{' '}
                  {pilotFormStatusLabels[form.pilotStatus] ?? form.pilotStatus}
                </option>
              ))}
            </select>
          </label>

          {selectedForm ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
              <StatusBadge status={selectedForm.pilotStatus} />
              <ValidationBadge validation={selectedForm.blueprintValidation} />

              {selectedForm.isLocked ? (
                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
                  Locked
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-[#07142f]/80 px-3 py-1 text-xs font-black text-slate-300">
                  Unlocked
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {selectedForm ? (
        <>
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Form version
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {selectedForm.versionLabel ?? `v${selectedForm.version}`}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Numeric version: {selectedForm.version}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Items
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {selectedForm.blueprintValidation.totalActualItems}/
                {selectedForm.blueprintValidation.totalExpectedItems}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Active mappings counted by blueprint validation.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Scoring version
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {selectedForm.scoringVersion}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Captured on future sessions.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Report version
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {selectedForm.reportVersion}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Captured on future reports/sessions.
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">
                    Blueprint validation
                  </h3>

                  <p className="mt-1 text-sm leading-7 text-slate-400">
                    First pilot blueprint: verbal 8, numerical 8, abstract 10,
                    logical 8, analytical problem-solving 6.
                  </p>
                </div>

                <ValidationBadge
                  validation={selectedForm.blueprintValidation}
                />
              </div>

              <div className="mt-5">
                <BlueprintTable validation={selectedForm.blueprintValidation} />
              </div>

              {selectedForm.blueprintValidation.errors.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3">
                  <p className="text-sm font-black text-red-100">Errors</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-red-100">
                    {selectedForm.blueprintValidation.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedForm.blueprintValidation.warnings.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3">
                  <p className="text-sm font-black text-amber-100">Warnings</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-amber-100">
                    {selectedForm.blueprintValidation.warnings.map(
                      (warning) => (
                        <li key={warning}>{warning}</li>
                      )
                    )}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
                <h3 className="text-lg font-black text-white">
                  Status control
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Locking or activating a pilot form will fail unless backend
                  blueprint validation passes. Locked-form overrides require
                  platform-admin authority and an override reason.
                </p>

                <div className="mt-5 space-y-4">
                  <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
                    Target status
                    <select
                      value={selectedStatus}
                      onChange={(event) =>
                        setSelectedStatus(event.target.value)
                      }
                      className="min-h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {pilotFormStatusLabels[status] ?? status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
                    Override reason
                    <textarea
                      value={overrideReason}
                      onChange={(event) =>
                        setOverrideReason(event.target.value)
                      }
                      rows={4}
                      placeholder="Required only for locked-form override actions."
                      className="rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void handleStatusUpdate()}
                    disabled={isUpdatingStatus}
                    className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Update status'}
                  </button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
                <h3 className="text-lg font-black text-white">
                  Governance metadata
                </h3>

                <dl className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                    <dt className="text-slate-500">Form ID</dt>
                    <dd className="mt-1 break-all font-black text-white">
                      {selectedForm.id}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                    <dt className="text-slate-500">Locked at</dt>
                    <dd className="mt-1 font-black text-white">
                      {selectedForm.lockedAt ?? 'Not locked'}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                    <dt className="text-slate-500">Locked by</dt>
                    <dd className="mt-1 font-black text-white">
                      {selectedForm.lockedBy ?? 'Not locked'}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                    <dt className="text-slate-500">Sections</dt>
                    <dd className="mt-1 font-black text-white">
                      {selectedForm.sectionCount}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
                    <dt className="text-slate-500">Active item mappings</dt>
                    <dd className="mt-1 font-black text-white">
                      {selectedForm.activeItemCount}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <details className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <summary className="cursor-pointer text-sm font-black text-slate-200">
              Show stored blueprint and timing JSON
            </summary>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-sm font-black text-slate-300">
                  Domain blueprint
                </p>

                <pre className="mt-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#020817] p-4 text-xs leading-6 text-cyan-50">
                  {formatJson(selectedForm.domainBlueprint)}
                </pre>
              </div>

              <div>
                <p className="text-sm font-black text-slate-300">
                  Timing rules
                </p>

                <pre className="mt-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#020817] p-4 text-xs leading-6 text-cyan-50">
                  {formatJson(selectedForm.timingRules)}
                </pre>
              </div>
            </div>
          </details>
        </>
      ) : (
        <div className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 text-sm text-slate-400 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          No pilot form exists yet. Use “Create/fetch formal pilot form” to
          create or retrieve the governed IQMeridian pilot form.
        </div>
      )}
    </section>
  );
}
