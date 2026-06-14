'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  attachInternalItemToForm,
  itemDomainLabels,
  itemReviewStatusLabels,
  itemStatusLabels,
  psychometricItemStatusLabels,
  type InternalItemDetailOutput,
  type InternalItemTraceabilityOutput,
  type InternalPilotFormOutput,
  type InternalPilotFormSectionOutput,
} from '../_lib/internal-api';

const mappingStatusOptions = ['ACTIVE', 'INACTIVE'];

function getPreferredInitialForm(forms: InternalPilotFormOutput[]) {
  return (
    forms.find((form) =>
      form.name.includes('General Cognitive Ability Pilot Form')
    ) ??
    forms.find((form) => form.name.includes('MVP Cognitive Assessment')) ??
    forms[0] ??
    null
  );
}

function getPreferredSection({
  form,
  item,
}: {
  form: InternalPilotFormOutput | null;
  item: InternalItemDetailOutput;
}) {
  if (!form) {
    return null;
  }

  return (
    form.sections.find((section) => section.domain === item.domain) ??
    form.sections[0] ??
    null
  );
}

function getBlueprintCountForItemDomain({
  form,
  item,
}: {
  form: InternalPilotFormOutput | null;
  item: InternalItemDetailOutput;
}) {
  if (!form) {
    return null;
  }

  const expected = form.blueprintValidation.expectedBlueprint[item.domain];
  const actual = form.blueprintValidation.actualBlueprint[item.domain] ?? 0;

  if (expected === undefined) {
    return null;
  }

  return {
    expected,
    actual,
    gap: actual - expected,
  };
}

function SectionOptionLabel({
  section,
}: {
  section: InternalPilotFormSectionOutput;
}) {
  return (
    <>
      {section.title} — {itemDomainLabels[section.domain] ?? section.domain}
    </>
  );
}

export function ItemFormPlacementClient({
  item,
  forms,
}: {
  item: InternalItemDetailOutput;
  forms: InternalPilotFormOutput[];
}) {
  const initialForm = getPreferredInitialForm(forms);
  const initialSection = getPreferredSection({
    form: initialForm,
    item,
  });

  const [selectedFormId, setSelectedFormId] = useState(initialForm?.id ?? '');
  const [selectedSectionId, setSelectedSectionId] = useState(
    initialSection?.id ?? ''
  );
  const [orderIndex, setOrderIndex] = useState('1');
  const [mappingStatus, setMappingStatus] = useState('ACTIVE');
  const [overrideReason, setOverrideReason] = useState('');
  const [traceability, setTraceability] =
    useState<InternalItemTraceabilityOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedForm = useMemo(
    () => forms.find((form) => form.id === selectedFormId) ?? null,
    [forms, selectedFormId]
  );

  const selectedSection = useMemo(
    () =>
      selectedForm?.sections.find(
        (section) => section.id === selectedSectionId
      ) ?? null,
    [selectedForm, selectedSectionId]
  );

  const blueprintCount = getBlueprintCountForItemDomain({
    form: selectedForm,
    item,
  });

  const itemIsPilotReady =
    item.psychometricStatus === 'PILOT_READY' &&
    item.reviewStatus === 'APPROVED_FOR_PILOT';

  function handleFormChange(formId: string) {
    const nextForm = forms.find((form) => form.id === formId) ?? null;
    const nextSection = getPreferredSection({
      form: nextForm,
      item,
    });

    setSelectedFormId(formId);
    setSelectedSectionId(nextSection?.id ?? '');
    setTraceability(null);
    setErrorMessage('');
  }

  async function handleSubmit() {
    if (!selectedForm) {
      setErrorMessage('Select a form before attaching the item.');
      return;
    }

    const parsedOrderIndex = Number(orderIndex);

    if (Number.isNaN(parsedOrderIndex) || parsedOrderIndex < 1) {
      setErrorMessage('Order index must be a positive number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setTraceability(null);

    try {
      const result = await attachInternalItemToForm({
        itemId: item.id,
        input: {
          formId: selectedForm.id,
          sectionId:
            selectedSectionId.trim().length > 0 ? selectedSectionId : null,
          orderIndex: parsedOrderIndex,
          status: mappingStatus,
          overrideReason:
            overrideReason.trim().length > 0 ? overrideReason.trim() : null,
        },
      });

      setTraceability(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Item could not be attached to the selected form.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Attach item to form</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Select a real database-backed assessment form and section. This
          mapping affects form blueprint counts, exposure, traceability, and
          later psychometric interpretation.
        </p>
      </div>

      <div className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Item</p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-950">
            {item.id}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {itemDomainLabels[item.domain] ?? item.domain}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Readiness
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {psychometricItemStatusLabels[item.psychometricStatus] ??
              item.psychometricStatus}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {itemReviewStatusLabels[item.reviewStatus] ?? item.reviewStatus}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Operational status
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {itemStatusLabels[item.status] ?? item.status}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {itemIsPilotReady
              ? 'Eligible for pilot-form assembly.'
              : 'Not fully pilot-ready yet.'}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          {errorMessage}
        </div>
      ) : null}

      {traceability ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          Item attached. This item now has {traceability.forms.length} form
          association{traceability.forms.length === 1 ? '' : 's'}.
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Form
          <select
            value={selectedFormId}
            onChange={(event) => handleFormChange(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            <option value="">Select a form</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name} {form.versionLabel ?? `v${form.version}`} —{' '}
                {form.pilotStatus}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Section
          <select
            value={selectedSectionId}
            onChange={(event) => setSelectedSectionId(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            <option value="">No section</option>
            {selectedForm?.sections.map((section) => (
              <option key={section.id} value={section.id}>
                <SectionOptionLabel section={section} />
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Order index
          <input
            value={orderIndex}
            onChange={(event) => setOrderIndex(event.target.value)}
            inputMode="numeric"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Mapping status
          <select
            value={mappingStatus}
            onChange={(event) => setMappingStatus(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {mappingStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedForm ? (
        <div className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Selected form status
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {selectedForm.pilotStatus}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {selectedForm.isLocked ? 'Locked' : 'Unlocked'}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Blueprint count for item domain
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {blueprintCount
                ? `${blueprintCount.actual}/${blueprintCount.expected}`
                : 'Not part of blueprint'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {blueprintCount
                ? blueprintCount.gap === 0
                  ? 'Domain quota is currently filled.'
                  : blueprintCount.gap < 0
                    ? `${Math.abs(blueprintCount.gap)} more needed.`
                    : `${blueprintCount.gap} over target.`
                : 'No blueprint target for this domain.'}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Selected section
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {selectedSection?.title ?? 'No section selected'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {selectedSection
                ? (itemDomainLabels[selectedSection.domain] ??
                  selectedSection.domain)
                : 'No domain'}
            </p>
          </div>
        </div>
      ) : null}

      <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-slate-700">
        Override reason
        <textarea
          value={overrideReason}
          onChange={(event) => setOverrideReason(event.target.value)}
          rows={4}
          placeholder="Required only for locked-form override actions."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
        />
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? 'Attaching...' : 'Attach item to selected form'}
        </button>

        <Link
          href={`/internal/researcher/item-bank/${encodeURIComponent(item.id)}`}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          Return to item detail
        </Link>

        <Link
          href="/internal/researcher/pilot-forms"
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          View pilot forms
        </Link>
      </div>
    </section>
  );
}
