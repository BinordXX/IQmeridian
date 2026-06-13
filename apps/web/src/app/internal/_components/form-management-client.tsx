'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  createInternalAssessmentForm,
  itemDomainLabels,
  pilotFormStatusLabels,
  type InternalPilotFormOutput,
} from '../_lib/internal-api';

const defaultBlueprint = {
  VERBAL_REASONING: 8,
  NUMERICAL_REASONING: 8,
  ABSTRACT_REASONING: 10,
  LOGICAL_REASONING: 8,
  ANALYTICAL_PROBLEM_SOLVING: 6,
};

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export function FormManagementClient({
  initialForms,
}: {
  initialForms: InternalPilotFormOutput[];
}) {
  const [forms, setForms] = useState(initialForms);
  const [name, setName] = useState('IQMeridian Pilot Form');
  const [version, setVersion] = useState('1');
  const [versionLabel, setVersionLabel] = useState('v0.1');
  const [scoringVersion, setScoringVersion] = useState('1');
  const [reportVersion, setReportVersion] = useState('1');
  const [verbalCount, setVerbalCount] = useState('8');
  const [numericalCount, setNumericalCount] = useState('8');
  const [abstractCount, setAbstractCount] = useState('10');
  const [logicalCount, setLogicalCount] = useState('8');
  const [analyticalCount, setAnalyticalCount] = useState('6');
  const [createStandardSections, setCreateStandardSections] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const totalItems = useMemo(
    () =>
      parsePositiveInteger(verbalCount, 0) +
      parsePositiveInteger(numericalCount, 0) +
      parsePositiveInteger(abstractCount, 0) +
      parsePositiveInteger(logicalCount, 0) +
      parsePositiveInteger(analyticalCount, 0),
    [
      verbalCount,
      numericalCount,
      abstractCount,
      logicalCount,
      analyticalCount,
    ]
  );

  async function handleCreateForm() {
    setMessage('');
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Form name is required.');
      return;
    }

    setIsCreating(true);

    try {
      const form = await createInternalAssessmentForm({
        name: name.trim(),
        version: parsePositiveInteger(version, 1),
        versionLabel: versionLabel.trim() || null,
        scoringVersion: parsePositiveInteger(scoringVersion, 1),
        reportVersion: parsePositiveInteger(reportVersion, 1),
        pilotStatus: 'DRAFT',
        createStandardSections,
        domainBlueprint: {
          VERBAL_REASONING: parsePositiveInteger(verbalCount, defaultBlueprint.VERBAL_REASONING),
          NUMERICAL_REASONING: parsePositiveInteger(numericalCount, defaultBlueprint.NUMERICAL_REASONING),
          ABSTRACT_REASONING: parsePositiveInteger(abstractCount, defaultBlueprint.ABSTRACT_REASONING),
          LOGICAL_REASONING: parsePositiveInteger(logicalCount, defaultBlueprint.LOGICAL_REASONING),
          ANALYTICAL_PROBLEM_SOLVING: parsePositiveInteger(
            analyticalCount,
            defaultBlueprint.ANALYTICAL_PROBLEM_SOLVING
          ),
        },
        timingRules: {
          totalRecommendedMinutes: 45,
          sectionTiming: {
            VERBAL_REASONING: 480,
            NUMERICAL_REASONING: 600,
            ABSTRACT_REASONING: 720,
            LOGICAL_REASONING: 600,
            ANALYTICAL_PROBLEM_SOLVING: 480,
          },
        },
      });

      setForms((currentForms) => [form, ...currentForms]);
      setMessage(`Created ${form.name} ${form.versionLabel ?? `v${form.version}`}.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Assessment form could not be created.'
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Create assessment form</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create reusable assessment forms. A pilot form is just one form type;
          later versions can be created from the same workflow.
        </p>

        {message ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Form name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Version number
              <input
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                inputMode="numeric"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Version label
              <input
                value={versionLabel}
                onChange={(event) => setVersionLabel(event.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Total target items
              <input
                value={String(totalItems)}
                readOnly
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Scoring version
              <input
                value={scoringVersion}
                onChange={(event) => setScoringVersion(event.target.value)}
                inputMode="numeric"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Report version
              <input
                value={reportVersion}
                onChange={(event) => setReportVersion(event.target.value)}
                inputMode="numeric"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              />
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Blueprint targets
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              These counts define how many active items should be attached per
              domain before the form is considered blueprint-valid.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Verbal reasoning
                <input
                  value={verbalCount}
                  onChange={(event) => setVerbalCount(event.target.value)}
                  inputMode="numeric"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Numerical reasoning
                <input
                  value={numericalCount}
                  onChange={(event) => setNumericalCount(event.target.value)}
                  inputMode="numeric"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Abstract reasoning
                <input
                  value={abstractCount}
                  onChange={(event) => setAbstractCount(event.target.value)}
                  inputMode="numeric"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Logical reasoning
                <input
                  value={logicalCount}
                  onChange={(event) => setLogicalCount(event.target.value)}
                  inputMode="numeric"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                Analytical problem-solving
                <input
                  value={analyticalCount}
                  onChange={(event) => setAnalyticalCount(event.target.value)}
                  inputMode="numeric"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={createStandardSections}
              onChange={(event) =>
                setCreateStandardSections(event.target.checked)
              }
            />
            Create standard five IQMeridian cognitive sections
          </label>

          <button
            type="button"
            onClick={() => void handleCreateForm()}
            disabled={isCreating}
            className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isCreating ? 'Creating...' : 'Create form'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Existing forms</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          These are database-backed assessment forms available for item
          placement and governance.
        </p>

        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Form</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Locked</th>
                <th className="px-4 py-3">Sections</th>
                <th className="px-4 py-3">Blueprint</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {forms.map((form) => (
                <tr key={form.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">{form.name}</p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {form.id}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {form.versionLabel ?? `v${form.version}`}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {pilotFormStatusLabels[form.pilotStatus] ??
                      form.pilotStatus}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {form.isLocked ? 'Yes' : 'No'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {form.sectionCount}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {form.blueprintValidation.totalActualItems}/
                    {form.blueprintValidation.totalExpectedItems}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/internal/researcher/pilot-forms"
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800"
                      >
                        Govern
                      </Link>
                      <Link
                        href="/internal/researcher/item-bank"
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800"
                      >
                        Add items
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          Use the item bank to attach pilot-ready items to any form. Use pilot
          governance to validate, lock, and activate forms.
        </div>
      </section>
    </div>
  );
}