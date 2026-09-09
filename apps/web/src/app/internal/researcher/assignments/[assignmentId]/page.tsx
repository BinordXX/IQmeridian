import Link from 'next/link';

import { fetchAssignmentItems } from '../_lib/researcher-authoring-api';
import {
  createAssignmentItemAction,
  submitAssignmentItemAction,
} from './actions';

export const dynamic = 'force-dynamic';

type ResearcherAssignmentDetailPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    updated?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  'prompt-required': 'Enter an item prompt.',
  'item-type-required': 'Enter an item type.',
  'invalid-json':
    'Options, correct answer, and rationale fields must be valid JSON.',
  'invalid-number': 'Estimated response time must be a valid positive number.',
  'create-failed': 'The item could not be created.',
  'submit-failed': 'The item could not be submitted.',
  'correct-option-required': 'Select the correct option.',
  'options-required': 'Enter at least two answer options.',
  'image-too-large': 'Each image must be 5 MB or smaller.',
  'unsupported-image-type': 'Use PNG, JPG, WebP, or GIF images only.',
};

const updatedMessages: Record<string, string> = {
  created: 'Item created as a draft.',
  'created-submitted': 'Item created and submitted for review.',
  submitted: 'Item submitted for review.',
};

const getReviewStatusClassName = (status: string) => {
  if (status === 'APPROVED') {
    return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
  }

  if (status === 'SUBMITTED_FOR_REVIEW' || status === 'REVIEW_IN_PROGRESS') {
    return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
  }

  if (status === 'NEEDS_REVISION') {
    return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
  }

  if (status === 'REJECTED') {
    return 'border-red-300/20 bg-red-400/10 text-red-100';
  }

  return 'border-white/10 bg-white/[0.04] text-slate-300';
};

const stringifyJson = (value: unknown) =>
  JSON.stringify(value ?? null, null, 2);

export default async function ResearcherAssignmentDetailPage({
  params,
  searchParams,
}: ResearcherAssignmentDetailPageProps) {
  const { assignmentId } = await params;
  const resolvedSearchParams = await searchParams;

  const { assignment, items } = await fetchAssignmentItems(assignmentId);

  const rawError = resolvedSearchParams?.error;
  const rawUpdated = resolvedSearchParams?.updated;

  const errorMessage = rawError ? (errorMessages[rawError] ?? rawError) : null;
  const updatedMessage = rawUpdated
    ? (updatedMessages[rawUpdated] ?? 'Changes saved.')
    : null;

  const createAction = createAssignmentItemAction.bind(null, assignment.id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          className="text-sm font-semibold text-slate-400 underline-offset-4 hover:text-cyan-100 hover:underline"
          href="/internal/researcher/assignments"
        >
          ← Back to assignments
        </Link>
      </div>

      {errorMessage ? (
        <section className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">
          {errorMessage}
        </section>
      ) : null}

      {updatedMessage ? (
        <section className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">
          {updatedMessage}
        </section>
      ) : null}

      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.18),transparent_32%)]"
        />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            {assignment.section.domain}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            {assignment.section.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            {assignment.form.name}. Target: {assignment.targetItemCount} items.
            Created so far: {items.length}.
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
        <h2 className="text-xl font-black text-white">Create item</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          The item will inherit the assigned section domain automatically. Do
          not include scoring keys in the candidate-facing prompt.
        </p>

        <form
          action={createAction}
          className="mt-6 grid gap-5"
          encType="multipart/form-data"
        >
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Prompt
            </span>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
              name="prompt"
              required
            />
          </label>

          <div className="grid gap-5 lg:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Item type
              </span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
                defaultValue="MULTIPLE_CHOICE"
                name="itemType"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Scoring rule
              </span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
                defaultValue="BINARY_CORRECT"
                name="scoringRule"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Intended difficulty
              </span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
                defaultValue="MODERATE"
                name="intendedDifficulty"
              >
                <option value="">Unspecified</option>
                <option value="EASY">EASY</option>
                <option value="MODERATE">MODERATE</option>
                <option value="HARD">HARD</option>
                <option value="VERY_HARD">VERY_HARD</option>
              </select>
            </label>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Optional stimulus image
              </span>
              <input
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:text-xs file:font-black file:text-slate-950 focus:border-cyan-300/40"
                name="stimulusImage"
                type="file"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Stimulus image alt text
              </span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
                name="stimulusImageAlt"
                placeholder="Describe the image for accessibility"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Optional stimulus text, passage, table, or sequence
            </span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
              name="stimulusText"
              placeholder="Use this for passages, data tables, number sequences, or extra context."
            />
          </label>

          <section className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
            <h3 className="text-sm font-black text-cyan-100">Answer options</h3>
            <p className="mt-1 text-sm leading-6 text-cyan-100/70">
              Add text, an image, or both for each option. The system will build
              the internal JSON automatically.
            </p>

            <div className="mt-5 grid gap-5">
              {(['A', 'B', 'C', 'D'] as const).map((optionId) => (
                <div
                  className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"
                  key={optionId}
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Option {optionId}
                  </p>

                  <div className="mt-3 grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Text
                      </span>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
                        name={`optionText${optionId}`}
                        placeholder={`Option ${optionId} text`}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Image
                      </span>
                      <input
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:text-xs file:font-black file:text-slate-950 focus:border-cyan-300/40"
                        name={`optionImage${optionId}`}
                        type="file"
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Image alt text
                      </span>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
                        name={`optionImageAlt${optionId}`}
                        placeholder={`Describe option ${optionId} image`}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Distractor rationale
                      </span>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
                        name={`rationale${optionId}`}
                        placeholder="Why this option is correct or incorrect"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Correct option
            </span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
              defaultValue="A"
              name="correctOptionId"
              required
            >
              <option value="">Select correct option</option>
              <option value="A">Option A</option>
              <option value="B">Option B</option>
              <option value="C">Option C</option>
              <option value="D">Option D</option>
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-bold text-slate-300">
            <input
              className="h-4 w-4 rounded border-white/20 bg-slate-950"
              name="submitAfterCreate"
              type="checkbox"
            />
            Create and submit immediately for admin review
          </label>

          <div className="flex justify-end">
            <button
              className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
              type="submit"
            >
              Save item
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-white">Items</h2>

        {items.length > 0 ? (
          items.map((item) => {
            const submitAction = submitAssignmentItemAction.bind(
              null,
              assignment.id,
              item.id
            );

            return (
              <article
                className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
                key={item.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${getReviewStatusClassName(
                        item.reviewStatus
                      )}`}
                    >
                      {item.reviewStatus}
                    </span>

                    <p className="mt-4 text-sm leading-6 text-white">
                      {item.prompt}
                    </p>

                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      {item.status} · {item.itemType} ·{' '}
                      {item.intendedDifficulty ?? 'Unspecified difficulty'}
                    </p>
                  </div>

                  {item.status === 'DRAFT' &&
                  ['NOT_REVIEWED', 'NEEDS_REVISION'].includes(
                    item.reviewStatus
                  ) ? (
                    <form action={submitAction}>
                      <button
                        className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-300/40"
                        type="submit"
                      >
                        Submit
                      </button>
                    </form>
                  ) : null}
                </div>

                {item.revisionRequestReason || item.rejectionReason ? (
                  <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                    {item.revisionRequestReason ?? item.rejectionReason}
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-10 text-center">
            <p className="text-sm font-bold text-slate-400">
              No items have been created for this assignment.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}
