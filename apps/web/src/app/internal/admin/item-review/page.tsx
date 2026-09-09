import {
  approveItemAction,
  rejectItemAction,
  requestItemChangesAction,
  startItemReviewAction,
} from './actions';
import {
  fetchReviewQueueItems,
  type ReviewQueueItem,
} from './_lib/item-review-api';

export const dynamic = 'force-dynamic';

type AdminItemReviewPageProps = {
  searchParams?: Promise<{
    error?: string;
    updated?: string;
  }>;
};

const updatedMessages: Record<string, string> = {
  'review-started': 'Item moved into review.',
  'changes-requested': 'Change request sent.',
  rejected: 'Item rejected.',
  approved: 'Item approved.',
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

type ReviewOption = {
  optionId?: string;
  label?: string;
  text?: string;
  imageUrl?: string;
  imageAltText?: string;
  altText?: string;
};

type ReviewStimulus = {
  kind?: string;
  content?: string;
  imageUrl?: string;
  altText?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getStringValue = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const getReviewOptions = (value: unknown): ReviewOption[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((option) => ({
    optionId: getStringValue(option.optionId) ?? undefined,
    label: getStringValue(option.label) ?? undefined,
    text: getStringValue(option.text) ?? undefined,
    imageUrl: getStringValue(option.imageUrl) ?? undefined,
    imageAltText: getStringValue(option.imageAltText) ?? undefined,
    altText: getStringValue(option.altText) ?? undefined,
  }));
};

const getCorrectOptionId = (value: unknown) => {
  if (!isRecord(value)) {
    return null;
  }

  return getStringValue(value.optionId);
};

const getStimulus = (value: unknown): ReviewStimulus | null => {
  if (!isRecord(value)) {
    return null;
  }

  const content =
    getStringValue(value.content) ?? getStringValue(value.imageUrl);

  if (!content) {
    return null;
  }

  return {
    kind: getStringValue(value.kind) ?? 'text',
    content,
    imageUrl: getStringValue(value.imageUrl) ?? undefined,
    altText: getStringValue(value.altText) ?? undefined,
  };
};

const isImagePath = (value?: string | null) =>
  Boolean(
    value &&
    (value.startsWith('/uploads/') ||
      value.startsWith('http://') ||
      value.startsWith('https://'))
  );

const getResearcherLabel = (item: ReviewQueueItem) =>
  item.sourceAssignment?.researcher.name ??
  item.sourceAssignment?.researcher.email ??
  item.createdByUser?.name ??
  item.createdByUser?.email ??
  'Unknown researcher';

export default async function AdminItemReviewPage({
  searchParams,
}: AdminItemReviewPageProps) {
  const resolvedSearchParams = await searchParams;

  const items = await fetchReviewQueueItems();

  const errorMessage = resolvedSearchParams?.error ?? null;
  const updatedMessage = resolvedSearchParams?.updated
    ? (updatedMessages[resolvedSearchParams.updated] ?? 'Changes saved.')
    : null;

  const pendingItems = items.filter((item) =>
    ['SUBMITTED_FOR_REVIEW', 'REVIEW_IN_PROGRESS'].includes(item.reviewStatus)
  );

  const historicalItems = items.filter(
    (item) =>
      !['SUBMITTED_FOR_REVIEW', 'REVIEW_IN_PROGRESS'].includes(
        item.reviewStatus
      )
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.18),transparent_32%)]"
        />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Item governance
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Review queue
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Review submitted researcher-authored items before they become active
            assessment content.
          </p>
        </div>
      </section>

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

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Pending review
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {pendingItems.length}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Approved
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {items.filter((item) => item.reviewStatus === 'APPROVED').length}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Needs revision
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {
              items.filter((item) => item.reviewStatus === 'NEEDS_REVISION')
                .length
            }
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-black text-white">Pending items</h2>

        {pendingItems.length > 0 ? (
          pendingItems.map((item) => (
            <ReviewQueueCard item={item} key={item.id} />
          ))
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-10 text-center">
            <p className="text-sm font-bold text-slate-400">
              No items are currently waiting for admin review.
            </p>
          </section>
        )}
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-black text-white">Recent review history</h2>

        {historicalItems.length > 0 ? (
          historicalItems
            .slice(0, 20)
            .map((item) => (
              <ReviewQueueCard compact item={item} key={item.id} />
            ))
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-10 text-center">
            <p className="text-sm font-bold text-slate-400">
              No reviewed items yet.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}

function ReviewQueueCard({
  item,
  compact = false,
}: {
  item: ReviewQueueItem;
  compact?: boolean;
}) {
  const startAction = startItemReviewAction.bind(null, item.id);
  const approveAction = approveItemAction.bind(null, item.id);
  const requestChangesAction = requestItemChangesAction.bind(null, item.id);
  const rejectAction = rejectItemAction.bind(null, item.id);

  return (
    <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${getReviewStatusClassName(
              item.reviewStatus
            )}`}
          >
            {item.reviewStatus}
          </span>

          <h3 className="mt-4 text-lg font-black text-white">
            {item.assignedSection?.title ?? item.domain}
          </h3>

          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {item.assignedForm?.name ?? 'Unassigned form'} ·{' '}
            {getResearcherLabel(item)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          {item.status} · {item.psychometricStatus}
        </div>
      </div>

      <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-white">
        {item.prompt}
      </p>

      {!compact ? <ReviewItemMediaPreview item={item} /> : null}

      {item.reviewNotes ||
      item.revisionRequestReason ||
      item.rejectionReason ? (
        <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          {item.reviewNotes ??
            item.revisionRequestReason ??
            item.rejectionReason}
        </div>
      ) : null}

      {!compact ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {item.reviewStatus === 'SUBMITTED_FOR_REVIEW' ? (
            <form
              action={startAction}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <textarea
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
                name="reviewNotes"
                placeholder="Optional review note"
              />
              <button
                className="mt-3 w-full rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100"
                type="submit"
              >
                Start review
              </button>
            </form>
          ) : null}

          <form
            action={approveAction}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
          >
            <textarea
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
              name="reviewNotes"
              placeholder="Approval note"
            />
            <input
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
              min={0}
              name="orderIndex"
              placeholder="Optional order index"
              type="number"
            />
            <label className="mt-3 flex items-center gap-3 text-sm font-bold text-slate-300">
              <input defaultChecked name="activate" type="checkbox" />
              Activate and map to form section
            </label>
            <button
              className="mt-3 w-full rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-950"
              type="submit"
            >
              Approve
            </button>
          </form>

          <form
            action={requestChangesAction}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
          >
            <textarea
              className="min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
              name="reason"
              placeholder="Required change request"
            />
            <textarea
              className="mt-3 min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
              name="reviewNotes"
              placeholder="Internal note"
            />
            <button
              className="mt-3 w-full rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100"
              type="submit"
            >
              Request changes
            </button>
          </form>

          <form
            action={rejectAction}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
          >
            <textarea
              className="min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
              name="reason"
              placeholder="Rejection reason"
            />
            <textarea
              className="mt-3 min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
              name="reviewNotes"
              placeholder="Internal note"
            />
            <button
              className="mt-3 w-full rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              type="submit"
            >
              Reject
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function ReviewItemMediaPreview({ item }: { item: ReviewQueueItem }) {
  const stimulus = getStimulus(item.stimulus);
  const options = getReviewOptions(item.options);
  const correctOptionId = getCorrectOptionId(item.correctAnswer);

  return (
    <div className="mt-5 space-y-5">
      {stimulus ? (
        <section className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
            Question stimulus
          </p>

          {isImagePath(stimulus.content) ? (
            <figure className="mt-3">
              <img
                alt={stimulus.altText ?? 'Assessment stimulus'}
                className="max-h-[28rem] w-full rounded-2xl border border-white/10 bg-slate-950/50 object-contain p-2"
                src={stimulus.content}
              />
              {stimulus.altText ? (
                <figcaption className="mt-2 text-xs text-slate-400">
                  {stimulus.altText}
                </figcaption>
              ) : null}
            </figure>
          ) : (
            <p className="mt-3 whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-200">
              {stimulus.content}
            </p>
          )}
        </section>
      ) : null}

      <section>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Answer options
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              The highlighted option is the stored correct answer.
            </p>
          </div>

          <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-100">
            Correct: {correctOptionId ?? 'Not set'}
          </span>
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {options.length > 0 ? (
            options.map((option) => {
              const optionId = option.optionId ?? option.label ?? 'Option';
              const isCorrect = optionId === correctOptionId;

              return (
                <article
                  className={[
                    'rounded-2xl border p-4',
                    isCorrect
                      ? 'border-emerald-300/30 bg-emerald-400/10'
                      : 'border-white/10 bg-slate-950/40',
                  ].join(' ')}
                  key={`${optionId}-${option.imageUrl ?? option.text ?? ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={
                        isCorrect
                          ? 'text-sm font-black text-emerald-100'
                          : 'text-sm font-black text-white'
                      }
                    >
                      Option {optionId}
                    </p>

                    {isCorrect ? (
                      <span className="rounded-full border border-emerald-300/25 bg-emerald-400/15 px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100">
                        Correct
                      </span>
                    ) : null}
                  </div>

                  {option.text ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                      {option.text}
                    </p>
                  ) : null}

                  {option.imageUrl ? (
                    <figure className="mt-3">
                      <img
                        alt={
                          option.imageAltText ??
                          option.altText ??
                          `Option ${optionId}`
                        }
                        className="max-h-72 w-full rounded-2xl border border-white/10 bg-slate-950/50 object-contain p-2"
                        src={option.imageUrl}
                      />
                      {option.imageAltText || option.altText ? (
                        <figcaption className="mt-2 text-xs text-slate-400">
                          {option.imageAltText ?? option.altText}
                        </figcaption>
                      ) : null}
                    </figure>
                  ) : null}

                  {!option.text && !option.imageUrl ? (
                    <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm font-bold text-amber-100">
                      This option has no text or image.
                    </p>
                  ) : null}
                </article>
              );
            })
          ) : (
            <p className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">
              No structured options were found for this item.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
