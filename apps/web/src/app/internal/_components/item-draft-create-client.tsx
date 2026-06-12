'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  createInternalDraftItem,
  itemDomainLabels,
  itemIntendedDifficultyLabels,
  itemReviewStatusLabels,
  psychometricItemStatusLabels,
  type InternalItemDetailOutput,
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

function parseOptions(rawOptions: string) {
  return rawOptions
    .split('\n')
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
}

export function ItemDraftCreateClient() {
  const [itemId, setItemId] = useState('');
  const [domain, setDomain] = useState('ABSTRACT_REASONING');
  const [subdomain, setSubdomain] = useState('');
  const [itemFamily, setItemFamily] = useState('');
  const [stimulusType, setStimulusType] = useState('text');
  const [itemType, setItemType] = useState('MULTIPLE_CHOICE');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [scoringRule, setScoringRule] = useState('BINARY_CORRECT');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [intendedDifficulty, setIntendedDifficulty] = useState('MODERATE');
  const [estimatedResponseTimeSec, setEstimatedResponseTimeSec] =
    useState('60');
  const [cognitiveProcess, setCognitiveProcess] = useState('');
  const [itemRationale, setItemRationale] = useState('');
  const [reviewStatus, setReviewStatus] = useState('NOT_REVIEWED');
  const [psychometricStatus, setPsychometricStatus] = useState('DRAFT');
  const [distractorRationale, setDistractorRationale] = useState('');
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

      const parsedEstimatedResponseTime =
        estimatedResponseTimeSec.trim().length > 0
          ? Number(estimatedResponseTimeSec)
          : null;

      if (
        parsedEstimatedResponseTime !== null &&
        (Number.isNaN(parsedEstimatedResponseTime) ||
          parsedEstimatedResponseTime <= 0)
      ) {
        throw new Error('Estimated response time must be a positive number.');
      }
      const created = await createInternalDraftItem({
        id: itemId.trim().length > 0 ? itemId.trim() : undefined,
        domain,
        subdomain: subdomain.trim().length > 0 ? subdomain.trim() : null,
        itemFamily: itemFamily.trim().length > 0 ? itemFamily.trim() : null,
        itemType,
        stimulusType:
          stimulusType.trim().length > 0 ? stimulusType.trim() : null,
        prompt: prompt.trim(),
        options: parsedOptions,
        correctAnswer: correctAnswer.trim(),
        scoringRule: scoringRule.trim().length > 0 ? scoringRule.trim() : null,
        difficulty,
        intendedDifficulty,
        estimatedResponseTimeSec: parsedEstimatedResponseTime,
        cognitiveProcess:
          cognitiveProcess.trim().length > 0 ? cognitiveProcess.trim() : null,
        itemRationale:
          itemRationale.trim().length > 0 ? itemRationale.trim() : null,
        distractorRationale:
          distractorRationale.trim().length > 0
            ? distractorRationale.trim()
            : null,
        reviewStatus,
        psychometricStatus,
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
          Subdomain
          <input
            value={subdomain}
            onChange={(event) => setSubdomain(event.target.value)}
            placeholder="Example: analogy, inference, matrix reasoning"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Item family
          <input
            value={itemFamily}
            onChange={(event) => setItemFamily(event.target.value)}
            placeholder="Example: verbal_analogy, number_series"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
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
          Stimulus type
          <input
            value={stimulusType}
            onChange={(event) => setStimulusType(event.target.value)}
            placeholder="text, image, table, matrix, symbolic"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Scoring rule
          <input
            value={scoringRule}
            onChange={(event) => setScoringRule(event.target.value)}
            placeholder="BINARY_CORRECT"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
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

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Intended difficulty
          <select
            value={intendedDifficulty}
            onChange={(event) => setIntendedDifficulty(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {intendedDifficultyOptions.map((option) => (
              <option key={option} value={option}>
                {itemIntendedDifficultyLabels[option] ?? option}
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
          Cognitive process tested
          <textarea
            value={cognitiveProcess}
            onChange={(event) => setCognitiveProcess(event.target.value)}
            rows={3}
            placeholder="Example: verbal relational reasoning; rule induction; proportional reasoning."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Item rationale
          <textarea
            value={itemRationale}
            onChange={(event) => setItemRationale(event.target.value)}
            rows={4}
            placeholder="Explain why the correct answer is correct."
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
          Estimated response time in seconds
          <input
            value={estimatedResponseTimeSec}
            onChange={(event) =>
              setEstimatedResponseTimeSec(event.target.value)
            }
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

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Review status
          <select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
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
            value={psychometricStatus}
            onChange={(event) => setPsychometricStatus(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {psychometricStatusOptions.map((option) => (
              <option key={option} value={option}>
                {psychometricItemStatusLabels[option] ?? option}
              </option>
            ))}
          </select>
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
