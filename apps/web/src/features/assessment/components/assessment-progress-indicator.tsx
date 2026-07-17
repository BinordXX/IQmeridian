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
      className={`rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:rounded-[2rem] sm:p-5 ${className}`}
      aria-label="Assessment progress"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {sectionPosition ? (
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Section {sectionPosition.current} of {sectionPosition.total}
            </p>
          ) : null}

          <h2 className="mt-1 text-sm font-black text-white">
            {sectionTitle ?? 'Current section'}
          </h2>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-sm font-black text-white">
            Item {safeCurrentItem} of {safeTotalItems}
          </p>

          {typeof safeAnsweredItems === 'number' ? (
            <p className="text-xs text-slate-400">
              {safeAnsweredItems} answered
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-300 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label={`Assessment progress: ${progressPercent}% complete`}
          />
        </div>

        <p className="mt-2 text-xs text-slate-400">
          {progressPercent}% complete in this section
        </p>
      </div>
    </section>
  );
}
