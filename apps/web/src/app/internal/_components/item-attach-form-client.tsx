'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  attachInternalItemToForm,
  type InternalItemTraceabilityOutput,
} from '../_lib/internal-api';

const mvpFormOptions = [
  {
    formId: 'dev-form-mvp-1',
    label: 'IQMeridian MVP Cognitive Assessment',
  },
];

const mvpSectionOptions = [
  {
    sectionId: 'dev-section-abstract-1',
    label: 'Abstract reasoning',
  },
  {
    sectionId: 'dev-section-numerical-1',
    label: 'Numerical reasoning',
  },
];

export function ItemAttachFormClient({ itemId }: { itemId: string }) {
  const [formId, setFormId] = useState('dev-form-mvp-1');
  const [sectionId, setSectionId] = useState('dev-section-abstract-1');
  const [orderIndex, setOrderIndex] = useState('1');
  const [status, setStatus] = useState('ACTIVE');

  const [traceability, setTraceability] =
    useState<InternalItemTraceabilityOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAttachItemToForm() {
    setErrorMessage('');
    setTraceability(null);
    setIsSubmitting(true);

    try {
      if (formId.trim().length === 0) {
        throw new Error('Form ID is required.');
      }

      if (sectionId.trim().length === 0) {
        throw new Error('Section ID is required.');
      }

      const parsedOrderIndex =
        orderIndex.trim().length > 0 ? Number(orderIndex) : null;

      if (parsedOrderIndex !== null && Number.isNaN(parsedOrderIndex)) {
        throw new Error('Order index must be a valid number.');
      }

      const result = await attachInternalItemToForm({
        itemId,
        input: {
          formId: formId.trim(),
          sectionId: sectionId.trim(),
          orderIndex: parsedOrderIndex,
          status,
        },
      });

      setTraceability(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Item could not be attached to form.'
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
          This creates a real form-item mapping in the database. The action is
          explicit because item placement affects exposure, traceability, and
          later performance interpretation.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Form
          <select
            value={formId}
            onChange={(event) => setFormId(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {mvpFormOptions.map((form) => (
              <option key={form.formId} value={form.formId}>
                {form.label} ({form.formId})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Section
          <select
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {mvpSectionOptions.map((section) => (
              <option key={section.sectionId} value={section.sectionId}>
                {section.label} ({section.sectionId})
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
            placeholder="Example: 3"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Mapping status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        Current MVP placement options are limited to the development form and
        its two known sections. Later, this should be replaced with a
        database-backed form and section selector.
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAttachItemToForm}
          disabled={isSubmitting}
          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? 'Attaching item...' : 'Attach item to form'}
        </button>

        <Link
          href={`/internal/researcher/item-bank/${encodeURIComponent(itemId)}`}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          Return to item detail
        </Link>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {traceability ? (
        <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Item attached successfully. Current exposure count:{' '}
          <span className="font-semibold">
            {traceability.totalExposureCount}
          </span>
          .{' '}
          <Link
            href={`/internal/researcher/item-bank/${encodeURIComponent(
              itemId
            )}/traceability`}
            className="font-semibold underline-offset-4 hover:underline"
          >
            Open traceability view
          </Link>
        </div>
      ) : null}
    </section>
  );
}
