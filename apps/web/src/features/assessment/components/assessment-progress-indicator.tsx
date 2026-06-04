type SectionPosition = {
  current: number;
  total: number;
};

type AssessmentProgressIndicatorProps = {
  currentItemNumber: number;
  totalItems: number;
  sectionTitle?: string;
  sectionPosition?: SectionPosition;
  answeredItems?: number;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function AssessmentProgressIndicator({
  currentItemNumber,
  totalItems,
  sectionTitle,
  sectionPosition,
  answeredItems,
  className = '',
}: AssessmentProgressIndicatorProps) {
  const safeTotalItems = Math.max(totalItems, 0);
  const safeCurrentItem =
    safeTotalItems === 0 ? 0 : clamp(currentItemNumber, 1, safeTotalItems);

  const progressPercent =
    safeTotalItems === 0
      ? 0
      : Math.round((safeCurrentItem / safeTotalItems) * 100);

  const safeAnsweredItems =
    typeof answeredItems === 'number'
      ? clamp(answeredItems, 0, safeTotalItems)
      : undefined;

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
      aria-label="Assessment progress"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {sectionPosition ? (
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Section {sectionPosition.current} of {sectionPosition.total}
            </p>
          ) : null}

          <h2 className="mt-1 text-sm font-semibold text-slate-900">
            {sectionTitle ?? 'Current section'}
          </h2>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-sm font-semibold text-slate-900">
            Item {safeCurrentItem} of {safeTotalItems}
          </p>

          {typeof safeAnsweredItems === 'number' ? (
            <p className="text-xs text-slate-500">
              {safeAnsweredItems} answered
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label={`Assessment progress: ${progressPercent}% complete`}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {progressPercent}% complete in this section
        </p>
      </div>
    </section>
  );
}
