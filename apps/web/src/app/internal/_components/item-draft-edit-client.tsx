'use client';

import { FormEvent, useEffect, useState } from 'react';

import {
  formatJsonValue,
  itemDomainLabels,
  itemIntendedDifficultyLabels,
  itemReviewStatusLabels,
  itemStatusLabels,
  psychometricItemStatusLabels,
  updateInternalDraftItem,
  type InternalItemDetailOutput,
  type InternalItemOutput,
} from '../_lib/internal-api';

const domainOptions = [
  'VERBAL_REASONING',
  'NUMERICAL_REASONING',
  'ABSTRACT_REASONING',
  'LOGICAL_REASONING',
  'ANALYTICAL_PROBLEM_SOLVING',
];

const itemTypeOptions = [
  'multiple_choice',
  'verbal_analogy',
  'passage_inference',
  'number_series',
  'quantitative_comparison',
  'data_interpretation',
  'matrix_reasoning',
  'shape_sequence',
  'symbolic_pattern',
  'syllogism',
  'conditional_logic',
  'ordering_logic',
  'constraint_solving',
  'scenario_based_reasoning',
];

const difficultyOptions = ['EASY', 'MEDIUM', 'HARD'];
const intendedDifficultyOptions = ['EASY', 'MODERATE', 'HARD', 'VERY_HARD'];

const reviewStatusOptions = [
  'NOT_REVIEWED',
  'REVIEW_IN_PROGRESS',
  'APPROVED_FOR_PILOT',
  'NEEDS_REVISION',
  'REJECTED',
];

const psychometricStatusOptions = [
  'DRAFT',
  'CONTENT_REVIEWED',
  'PILOT_READY',
  'UNDER_REVIEW',
  'FLAGGED_AFTER_PILOT',
  'RETIRED',
  'CALIBRATED',
];

type EditableDraftForm = {
  domain: string;
  subdomain: string;
  itemFamily: string;
  itemType: string;
  stimulusType: string;
  prompt: string;
  optionsText: string;
  correctAnswer: string;
  scoringRule: string;
  difficulty: string;
  intendedDifficulty: string;
  estimatedResponseTimeSec: string;
  cognitiveProcess: string;
  itemRationale: string;
  distractorRationale: string;
  reviewStatus: string;
  psychometricStatus: string;
};

function toEditableDraftForm(
  item?: InternalItemDetailOutput
): EditableDraftForm {
  return {
    domain: item?.domain ?? 'VERBAL_REASONING',
    subdomain: item?.subdomain ?? '',
    itemFamily: item?.itemFamily ?? '',
    itemType: item?.itemType ?? 'multiple_choice',
    stimulusType: item?.stimulusType ?? 'text',
    prompt: item?.prompt ?? '',
    optionsText: Array.isArray(item?.options)
      ? item.options.join('\n')
      : formatJsonValue(item?.options),
    correctAnswer: formatJsonValue(item?.correctAnswer),
    scoringRule: item?.scoringRule ?? 'BINARY_CORRECT',
    difficulty: item?.difficulty ?? 'MEDIUM',
    intendedDifficulty: item?.intendedDifficulty ?? 'MODERATE',
    estimatedResponseTimeSec:
      item?.estimatedResponseTimeSec !== null &&
      item?.estimatedResponseTimeSec !== undefined
        ? item.estimatedResponseTimeSec.toString()
        : '',
    cognitiveProcess: item?.cognitiveProcess ?? '',
    itemRationale: item?.itemRationale ?? '',
    distractorRationale: formatJsonValue(item?.distractorRationale),
    reviewStatus: item?.reviewStatus ?? 'NOT_REVIEWED',
    psychometricStatus: item?.psychometricStatus ?? 'DRAFT',
  };
}

function parseOptions(rawOptions: string) {
  return rawOptions
    .split('\n')
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
}

async function fetchItemListFromProxy() {
  const response = await fetch('/internal/api/items', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Internal items could not be loaded.');
  }

  return response.json() as Promise<InternalItemOutput[]>;
}

async function fetchItemDetailFromProxy(itemId: string) {
  const response = await fetch(
    `/internal/api/items/${encodeURIComponent(itemId)}`,
    {
      method: 'GET',
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error('Internal item detail could not be loaded.');
  }

  return response.json() as Promise<InternalItemDetailOutput>;
}

export function ItemDraftEditClient({
  initialItemId,
}: {
  initialItemId?: string;
}) {
  const [items, setItems] = useState<InternalItemOutput[]>([]);
  const [selectedItemId, setSelectedItemId] = useState(initialItemId ?? '');
  const [selectedItem, setSelectedItem] =
    useState<InternalItemDetailOutput | null>(null);
  const [formState, setFormState] = useState<EditableDraftForm>(
    toEditableDraftForm()
  );
  const [savedItem, setSavedItem] = useState<InternalItemDetailOutput | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isEditableDraft = selectedItem?.status === 'DRAFT';

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const loadedItems = await fetchItemListFromProxy();

        if (cancelled) {
          return;
        }

        setItems(loadedItems);

        const nextItemId =
          initialItemId ??
          loadedItems.find((item) => item.status === 'DRAFT')?.id ??
          loadedItems[0]?.id ??
          '';

        setSelectedItemId(nextItemId);

        if (nextItemId.length > 0) {
          const detail = await fetchItemDetailFromProxy(nextItemId);

          if (!cancelled) {
            setSelectedItem(detail);
            setFormState(toEditableDraftForm(detail));
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Internal items could not be loaded.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadItems();

    return () => {
      cancelled = true;
    };
  }, [initialItemId]);

  async function handleItemChange(nextItemId: string) {
    setSelectedItemId(nextItemId);
    setSavedItem(null);
    setErrorMessage('');

    if (nextItemId.length === 0) {
      setSelectedItem(null);
      setFormState(toEditableDraftForm());
      return;
    }

    try {
      const detail = await fetchItemDetailFromProxy(nextItemId);
      setSelectedItem(detail);
      setFormState(toEditableDraftForm(detail));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Internal item detail could not be loaded.'
      );
    }
  }

  function updateField(field: keyof EditableDraftForm, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setSavedItem(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedItem || !isEditableDraft) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSavedItem(null);

    try {
      if (formState.prompt.trim().length === 0) {
        throw new Error('Prompt is required.');
      }

      const parsedOptions = parseOptions(formState.optionsText);

      if (parsedOptions.length < 2) {
        throw new Error('At least two answer options are required.');
      }

      if (formState.correctAnswer.trim().length === 0) {
        throw new Error('Correct answer is required.');
      }

      const parsedEstimatedResponseTime =
        formState.estimatedResponseTimeSec.trim().length > 0
          ? Number(formState.estimatedResponseTimeSec)
          : null;

      if (
        parsedEstimatedResponseTime !== null &&
        (Number.isNaN(parsedEstimatedResponseTime) ||
          parsedEstimatedResponseTime <= 0)
      ) {
        throw new Error('Estimated response time must be a positive number.');
      }

      const updated = await updateInternalDraftItem({
        itemId: selectedItem.id,
        input: {
          domain: formState.domain,
          subdomain:
            formState.subdomain.trim().length > 0
              ? formState.subdomain.trim()
              : null,
          itemFamily:
            formState.itemFamily.trim().length > 0
              ? formState.itemFamily.trim()
              : null,
          itemType: formState.itemType,
          stimulusType:
            formState.stimulusType.trim().length > 0
              ? formState.stimulusType.trim()
              : null,
          prompt: formState.prompt.trim(),
          options: parsedOptions,
          correctAnswer: formState.correctAnswer.trim(),
          scoringRule:
            formState.scoringRule.trim().length > 0
              ? formState.scoringRule.trim()
              : null,
          difficulty: formState.difficulty,
          intendedDifficulty: formState.intendedDifficulty,
          estimatedResponseTimeSec: parsedEstimatedResponseTime,
          cognitiveProcess:
            formState.cognitiveProcess.trim().length > 0
              ? formState.cognitiveProcess.trim()
              : null,
          itemRationale:
            formState.itemRationale.trim().length > 0
              ? formState.itemRationale.trim()
              : null,
          distractorRationale:
            formState.distractorRationale.trim().length > 0
              ? formState.distractorRationale.trim()
              : null,
          reviewStatus: formState.reviewStatus,
          psychometricStatus: formState.psychometricStatus,
        },
      });

      setSelectedItem(updated);
      setSavedItem(updated);
      setFormState(toEditableDraftForm(updated));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Draft item could not be updated.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Edit draft-stage item</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          This editor updates real database-backed item metadata through the
          internal API. Only draft items should be edited directly.
        </p>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading internal items...
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Select item
              <select
                value={selectedItemId}
                onChange={(event) => void handleItemChange(event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
              >
                <option value="">Select an item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} — {itemStatusLabels[item.status] ?? item.status}
                  </option>
                ))}
              </select>
            </label>

            {selectedItem ? (
              <div className="mt-5 space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Domain</p>
                  <p className="font-semibold">
                    {itemDomainLabels[selectedItem.domain] ??
                      selectedItem.domain}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Review status</p>
                  <p className="font-semibold">
                    {itemReviewStatusLabels[selectedItem.reviewStatus] ??
                      selectedItem.reviewStatus}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Psychometric status</p>
                  <p className="font-semibold">
                    {psychometricItemStatusLabels[
                      selectedItem.psychometricStatus
                    ] ?? selectedItem.psychometricStatus}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Empirical difficulty</p>
                  <p className="font-semibold">
                    {selectedItem.empiricalDifficulty !== null
                      ? `${Math.round(
                          selectedItem.empiricalDifficulty * 100
                        )}% correct`
                      : 'Not available yet'}
                  </p>
                </div>
              </div>
            ) : null}

            {!isEditableDraft && selectedItem ? (
              <div className="mt-5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
                This item is not currently a draft. Direct editing is disabled.
              </div>
            ) : null}
          </aside>

          <form onSubmit={handleSubmit} className="space-y-5">
            {savedItem ? (
              <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Draft item saved:{' '}
                <span className="font-semibold">{savedItem.id}</span>.
              </div>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Domain
                <select
                  value={formState.domain}
                  onChange={(event) =>
                    updateField('domain', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
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
                  value={formState.itemType}
                  onChange={(event) =>
                    updateField('itemType', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                >
                  {itemTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Subdomain
                <input
                  value={formState.subdomain}
                  onChange={(event) =>
                    updateField('subdomain', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Item family
                <input
                  value={formState.itemFamily}
                  onChange={(event) =>
                    updateField('itemFamily', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Stimulus type
                <input
                  value={formState.stimulusType}
                  onChange={(event) =>
                    updateField('stimulusType', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Scoring rule
                <input
                  value={formState.scoringRule}
                  onChange={(event) =>
                    updateField('scoringRule', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                />
              </label>
            </div>

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

            <div className="grid gap-5 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Difficulty estimate
                <select
                  value={formState.difficulty}
                  onChange={(event) =>
                    updateField('difficulty', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                >
                  {difficultyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Intended difficulty
                <select
                  value={formState.intendedDifficulty}
                  onChange={(event) =>
                    updateField('intendedDifficulty', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                >
                  {intendedDifficultyOptions.map((option) => (
                    <option key={option} value={option}>
                      {itemIntendedDifficultyLabels[option] ?? option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Estimated response time
                <input
                  value={formState.estimatedResponseTimeSec}
                  onChange={(event) =>
                    updateField('estimatedResponseTimeSec', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  type="number"
                  min={1}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Cognitive process tested
              <textarea
                value={formState.cognitiveProcess}
                onChange={(event) =>
                  updateField('cognitiveProcess', event.target.value)
                }
                disabled={!isEditableDraft}
                rows={3}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Item rationale
              <textarea
                value={formState.itemRationale}
                onChange={(event) =>
                  updateField('itemRationale', event.target.value)
                }
                disabled={!isEditableDraft}
                rows={4}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
              />
            </label>

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
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Review status
                <select
                  value={formState.reviewStatus}
                  onChange={(event) =>
                    updateField('reviewStatus', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                >
                  {reviewStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {itemReviewStatusLabels[option] ?? option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Psychometric status
                <select
                  value={formState.psychometricStatus}
                  onChange={(event) =>
                    updateField('psychometricStatus', event.target.value)
                  }
                  disabled={!isEditableDraft}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:bg-slate-100"
                >
                  {psychometricStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {psychometricItemStatusLabels[option] ?? option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={!isEditableDraft || isSaving}
              className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving ? 'Saving draft...' : 'Save draft revisions'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
