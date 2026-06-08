'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  createInternalDraftItem,
  itemDomainLabels,
  type InternalItemDetailOutput,
} from '../_lib/internal-api';

const domainOptions = [
  'ABSTRACT_REASONING',
  'NUMERICAL_REASONING',
  'VERBAL_REASONING',
  'SPATIAL_REASONING',
  'WORKING_MEMORY_REASONING',
];

const itemTypeOptions = ['MULTIPLE_CHOICE'];

const difficultyOptions = ['EASY', 'MEDIUM', 'HARD'];

function parseOptions(rawOptions: string) {
  return rawOptions
    .split('\n')
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
}

export function ItemDraftCreateClient() {
  const [itemId, setItemId] = useState('');
  const [domain, setDomain] = useState('ABSTRACT_REASONING');
  const [itemType, setItemType] = useState('MULTIPLE_CHOICE');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [distractorRationale, setDistractorRationale] = useState('');
  const [timeExpectationSeconds, setTimeExpectationSeconds] = useState('60');
  const [explanationNotes, setExplanationNotes] = useState('');
  const [assetLinkage, setAssetLinkage] = useState('');

  const [createdItem, setCreatedItem] =
    useState<InternalItemDetailOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateDraftItem() {
    setErrorMessage('');
    setCreatedItem(null);
    setIsSubmitting(true);

    try {
      if (prompt.trim().length === 0) {
        throw new Error('Prompt is required.');
      }

      const parsedOptions = parseOptions(options);

      if (parsedOptions.length < 2) {
        throw new Error('At least two answer options are required.');
      }

      if (correctAnswer.trim().length === 0) {
        throw new Error('Correct answer is required.');
      }

      const parsedTimeExpectation =
        timeExpectationSeconds.trim().length > 0
          ? Number(timeExpectationSeconds)
          : null;

      if (
        parsedTimeExpectation !== null &&
        Number.isNaN(parsedTimeExpectation)
      ) {
        throw new Error('Time expectation must be a valid number.');
      }

      const created = await createInternalDraftItem({
        id: itemId.trim().length > 0 ? itemId.trim() : undefined,
        domain,
        itemType,
        prompt: prompt.trim(),
        options: parsedOptions,
        correctAnswer: correctAnswer.trim(),
        difficulty,
        distractorRationale:
          distractorRationale.trim().length > 0
            ? distractorRationale.trim()
            : null,
        timeExpectationSeconds: parsedTimeExpectation,
        explanationNotes:
          explanationNotes.trim().length > 0 ? explanationNotes.trim() : null,
        assetLinkage:
          assetLinkage.trim().length > 0 ? assetLinkage.trim() : null,
      });

      setCreatedItem(created);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Draft item could not be created.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Create draft item</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          This form creates a real draft item through the internal API. The item
          is saved as a database-backed draft and recorded in the audit log as
          an internal item creation event.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Item ID or generated identifier
          <input
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            placeholder="Leave blank to generate one"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Domain
          <select
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {domainOptions.map((option) => (
              <option key={option} value={option}>
                {itemDomainLabels[option] ?? option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Item type
          <select
            value={itemType}
            onChange={(event) => setItemType(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {itemTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Difficulty estimate
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {difficultyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 lg:col-span-2">
          Prompt or visual stem
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            placeholder="Enter the item prompt or visual-stem description."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Options
          <textarea
            value={options}
            onChange={(event) => setOptions(event.target.value)}
            rows={6}
            placeholder={'One option per line\nA\nB\nC\nD'}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Correct answer
          <textarea
            value={correctAnswer}
            onChange={(event) => setCorrectAnswer(event.target.value)}
            rows={6}
            placeholder="Enter the correct answer exactly as it should be evaluated."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Distractor rationale
          <textarea
            value={distractorRationale}
            onChange={(event) => setDistractorRationale(event.target.value)}
            rows={4}
            placeholder="Explain why the incorrect options are plausible."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Optional explanation notes
          <textarea
            value={explanationNotes}
            onChange={(event) => setExplanationNotes(event.target.value)}
            rows={4}
            placeholder="Internal explanation, calibration note, or review note."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Time expectation in seconds
          <input
            value={timeExpectationSeconds}
            onChange={(event) => setTimeExpectationSeconds(event.target.value)}
            inputMode="numeric"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Asset upload linkage
          <input
            value={assetLinkage}
            onChange={(event) => setAssetLinkage(event.target.value)}
            placeholder="Optional asset URL or storage key"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCreateDraftItem}
          disabled={isSubmitting}
          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? 'Creating draft...' : 'Create draft item'}
        </button>

        <Link
          href="/internal/researcher/item-bank"
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          Return to item bank
        </Link>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {createdItem ? (
        <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Draft item created:{' '}
          <span className="font-semibold">{createdItem.id}</span>.{' '}
          <Link
            href={`/internal/researcher/item-bank/${encodeURIComponent(
              createdItem.id
            )}`}
            className="font-semibold underline-offset-4 hover:underline"
          >
            Open item detail
          </Link>
        </div>
      ) : null}
    </section>
  );
}
