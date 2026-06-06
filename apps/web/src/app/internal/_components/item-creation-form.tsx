'use client';

import { FormEvent, useState } from 'react';

import {
  itemDomainLabels,
  type InternalItemDomain,
  type InternalItemStatus,
  type InternalItemType,
} from '../_data/internal-tooling-data';

const domainOptions: InternalItemDomain[] = [
  'ABSTRACT',
  'NUMERICAL',
  'VERBAL',
  'SPATIAL',
  'WORKING_MEMORY',
];

const itemTypeOptions: InternalItemType[] = [
  'multiple-choice',
  'visual-pattern',
  'number-series',
  'matrix-reasoning',
  'verbal-analogy',
];

const statusOptions: InternalItemStatus[] = ['DRAFT', 'UNDER_REVIEW'];

export function ItemCreationForm() {
  const [domain, setDomain] = useState<InternalItemDomain>('ABSTRACT');
  const [itemId, setItemId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function generateItemId() {
    const generatedSegment =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().slice(0, 8).toUpperCase()
        : Math.random().toString(36).slice(2, 10).toUpperCase();

    setItemId(`IQM-${domain.slice(0, 3)}-${generatedSegment}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-xl font-semibold">Create assessment item</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          This screen captures the full item authoring model: identifier,
          domain, type, stem, options, answer key, difficulty estimate,
          distractor rationale, timing expectation, status, notes, and asset
          linkage. New items should normally begin as drafts.
        </p>
      </div>

      {submitted ? (
        <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Draft item captured in the authoring interface. API persistence and
          review workflow wiring should be connected after this UI scaffold is
          approved.
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Item ID or generated identifier
          <div className="flex gap-2">
            <input
              value={itemId}
              onChange={(event) => setItemId(event.target.value)}
              placeholder="Example: IQM-ABS-010"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              required
            />
            <button
              type="button"
              onClick={generateItemId}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            >
              Generate
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Domain
          <select
            value={domain}
            onChange={(event) =>
              setDomain(event.target.value as InternalItemDomain)
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {domainOptions.map((option) => (
              <option key={option} value={option}>
                {itemDomainLabels[option]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Item type
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            defaultValue="multiple-choice"
          >
            {itemTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Item status
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            defaultValue="DRAFT"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'DRAFT' ? 'Draft' : 'Under review'}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Prompt or visual stem
          <textarea
            rows={5}
            placeholder="Enter the item stem, or describe the linked visual stimulus."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Options
          <textarea
            rows={5}
            placeholder="One option per line, for example: A. ... "
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Correct answer
          <textarea
            rows={5}
            placeholder="State the correct option and answer-key logic."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Difficulty estimate
          <input
            placeholder="Example: Medium-high"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Time expectation in seconds
          <input
            type="number"
            min={1}
            placeholder="Example: 75"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Distractor rationale
          <textarea
            rows={4}
            placeholder="Explain why each distractor is plausible and what misconception it tests."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Optional explanation notes
          <textarea
            rows={4}
            placeholder="Add reviewer notes, scoring explanation, or psychometric assumptions."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Asset upload linkage
          <input
            placeholder="Example: asset://abstract/matrix-010"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white"
        >
          Stage draft item
        </button>
        <button
          type="reset"
          onClick={() => setSubmitted(false)}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          Clear form
        </button>
      </div>
    </form>
  );
}
