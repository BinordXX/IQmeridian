'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  updateInternalDraftItem,
  type InternalItemDetailOutput,
} from '../_lib/internal-api';

function normaliseJsonValueForText(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join('\n');
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  return JSON.stringify(value, null, 2);
}

export function ItemEditClient({ item }: { item: InternalItemDetailOutput }) {
  const [domain, setDomain] = useState(item.domain);
  const [itemType, setItemType] = useState(item.itemType);
  const [prompt, setPrompt] = useState(item.prompt);
  const [optionsText, setOptionsText] = useState(
    normaliseJsonValueForText(item.options)
  );
  const [correctAnswer, setCorrectAnswer] = useState(
    normaliseJsonValueForText(item.correctAnswer)
  );
  const [difficulty, setDifficulty] = useState(item.difficulty ?? '');
  const [note, setNote] = useState('');

  const [updatedItem, setUpdatedItem] =
    useState<InternalItemDetailOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditable = item.status === 'DRAFT';

  async function handleSaveDraftItem() {
    setErrorMessage('');
    setUpdatedItem(null);
    setIsSubmitting(true);

    try {
      if (!isEditable) {
        throw new Error('Only draft items can be edited.');
      }

      if (prompt.trim().length === 0) {
        throw new Error('Prompt is required.');
      }

      const options = optionsText
        .split('\n')
        .map((option) => option.trim())
        .filter(Boolean);

      if (options.length < 2) {
        throw new Error('At least two options are required.');
      }

      if (correctAnswer.trim().length === 0) {
        throw new Error('Correct answer is required.');
      }

      const updated = await updateInternalDraftItem({
        itemId: item.id,
        input: {
          domain: domain.trim(),
          itemType: itemType.trim(),
          prompt: prompt.trim(),
          options,
          correctAnswer: correctAnswer.trim(),
          difficulty: difficulty.trim().length > 0 ? difficulty.trim() : null,
          note: note.trim().length > 0 ? note.trim() : null,
        },
      });

      setUpdatedItem(updated);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Draft item could not be saved.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Edit draft item</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Editing is restricted to draft items. Active, retired, and reviewed
          operational items should not be silently changed because that would
          distort item history and performance interpretation.
        </p>
      </div>

      {!isEditable ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          This item is currently{' '}
          <span className="font-semibold">{item.status}</span>. It cannot be
          edited here. Return it to draft first, or create a new version if it
          has already been operationally used.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Domain
          <input
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            disabled={!isEditable}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Item type
          <input
            value={itemType}
            onChange={(event) => setItemType(event.target.value)}
            disabled={!isEditable}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 lg:col-span-2">
          Prompt
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={!isEditable}
            rows={4}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Options
          <textarea
            value={optionsText}
            onChange={(event) => setOptionsText(event.target.value)}
            disabled={!isEditable}
            rows={6}
            placeholder="One option per line"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
          />
          <span className="text-xs font-normal text-slate-500">
            Enter one option per line.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Correct answer
          <input
            value={correctAnswer}
            onChange={(event) => setCorrectAnswer(event.target.value)}
            disabled={!isEditable}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
          />
          <span className="text-xs font-normal text-slate-500">
            Use the same answer representation used by the item options.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Difficulty
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            disabled={!isEditable}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
          >
            <option value="">No difficulty set</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Edit note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={!isEditable}
            rows={3}
            placeholder="Optional internal note explaining the edit."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSaveDraftItem}
          disabled={!isEditable || isSubmitting}
          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? 'Saving draft...' : 'Save draft changes'}
        </button>

        <Link
          href={`/internal/researcher/item-bank/${encodeURIComponent(item.id)}`}
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

      {updatedItem ? (
        <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Draft item saved. Current version:{' '}
          <span className="font-semibold">{updatedItem.version}</span>.{' '}
          <Link
            href={`/internal/researcher/item-bank/${encodeURIComponent(
              updatedItem.id
            )}`}
            className="font-semibold underline-offset-4 hover:underline"
          >
            Open updated item detail
          </Link>
        </div>
      ) : null}
    </section>
  );
}
