'use client';

import { FormEvent, useMemo, useState } from 'react';

import {
  getInternalItemById,
  internalItems,
  itemDomainLabels,
  itemStatusLabels,
  type InternalItem,
} from '../_data/internal-tooling-data';

type EditableDraftForm = {
  label: string;
  prompt: string;
  optionsText: string;
  correctAnswer: string;
  difficultyEstimate: string;
  distractorRationale: string;
  timeExpectationSeconds: string;
  explanationNotes: string;
  assetLink: string;
};

function toEditableDraftForm(item?: InternalItem): EditableDraftForm {
  return {
    label: item?.label ?? '',
    prompt: item?.prompt ?? '',
    optionsText: item?.options.join('\n') ?? '',
    correctAnswer: item?.correctAnswer ?? '',
    difficultyEstimate: item?.difficultyEstimate ?? '',
    distractorRationale: item?.distractorRationale ?? '',
    timeExpectationSeconds: item?.timeExpectationSeconds.toString() ?? '',
    explanationNotes: item?.explanationNotes ?? '',
    assetLink: item?.assetLink ?? '',
  };
}

export function ItemDraftEditClient({
  initialItemId,
}: {
  initialItemId?: string;
}) {
  const firstDraftItem = useMemo(
    () => internalItems.find((item) => item.status === 'DRAFT'),
    []
  );

  const initialItem = initialItemId
    ? getInternalItemById(initialItemId)
    : firstDraftItem;

  const [selectedItemId, setSelectedItemId] = useState(initialItem?.id ?? '');
  const [formState, setFormState] = useState<EditableDraftForm>(
    toEditableDraftForm(initialItem)
  );
  const [saved, setSaved] = useState(false);

  const selectedItem = getInternalItemById(selectedItemId);
  const isEditableDraft = selectedItem?.status === 'DRAFT';

  function handleItemChange(nextItemId: string) {
    const nextItem = getInternalItemById(nextItemId);
    setSelectedItemId(nextItemId);
    setFormState(toEditableDraftForm(nextItem));
    setSaved(false);
  }

  function updateField(field: keyof EditableDraftForm, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isEditableDraft) {
      return;
    }

    setSaved(true);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Edit draft-stage item</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Only draft items can be revised in this screen. Active, retired, and
          under-review items are protected because changing them in place would
          compromise historical assessment interpretation.
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Select item
            <select
              value={selectedItemId}
              onChange={(event) => handleItemChange(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            >
              {internalItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} — {itemStatusLabels[item.status]}
                </option>
              ))}
            </select>
          </label>

          {selectedItem ? (
            <div className="mt-5 space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Domain</p>
                <p className="font-semibold">
                  {itemDomainLabels[selectedItem.domain]}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <p className="font-semibold">
                  {itemStatusLabels[selectedItem.status]}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Activation history</p>
                <p className="font-semibold">
                  {selectedItem.historicallyActive
                    ? 'Historically active'
                    : 'Never activated'}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-600">
              The selected item could not be found.
            </p>
          )}

          {!isEditableDraft ? (
            <div className="mt-5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
              This item is read-only in the draft editor. Create a new version
              rather than mutating historical assessment content.
            </div>
          ) : null}
        </aside>

        <form onSubmit={handleSubmit} className="space-y-5">
          {saved ? (
            <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Draft revisions staged in the interface. API persistence should
              commit these changes only while the item remains in draft status.
            </div>
          ) : null}

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Item label
            <input
              value={formState.label}
              onChange={(event) => updateField('label', event.target.value)}
              disabled={!isEditableDraft}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Prompt or visual stem
            <textarea
              value={formState.prompt}
              onChange={(event) => updateField('prompt', event.target.value)}
              disabled={!isEditableDraft}
              rows={5}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
              required
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Options
              <textarea
                value={formState.optionsText}
                onChange={(event) =>
                  updateField('optionsText', event.target.value)
                }
                disabled={!isEditableDraft}
                rows={5}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Correct answer
              <textarea
                value={formState.correctAnswer}
                onChange={(event) =>
                  updateField('correctAnswer', event.target.value)
                }
                disabled={!isEditableDraft}
                rows={5}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                required
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Difficulty estimate
              <input
                value={formState.difficultyEstimate}
                onChange={(event) =>
                  updateField('difficultyEstimate', event.target.value)
                }
                disabled={!isEditableDraft}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Time expectation in seconds
              <input
                value={formState.timeExpectationSeconds}
                onChange={(event) =>
                  updateField('timeExpectationSeconds', event.target.value)
                }
                disabled={!isEditableDraft}
                type="number"
                min={1}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                required
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Distractor rationale
            <textarea
              value={formState.distractorRationale}
              onChange={(event) =>
                updateField('distractorRationale', event.target.value)
              }
              disabled={!isEditableDraft}
              rows={4}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Optional explanation notes
            <textarea
              value={formState.explanationNotes}
              onChange={(event) =>
                updateField('explanationNotes', event.target.value)
              }
              disabled={!isEditableDraft}
              rows={4}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Asset upload linkage
            <input
              value={formState.assetLink}
              onChange={(event) => updateField('assetLink', event.target.value)}
              disabled={!isEditableDraft}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
            />
          </label>

          <button
            type="submit"
            disabled={!isEditableDraft}
            className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Save draft revisions
          </button>
        </form>
      </div>
    </section>
  );
}
