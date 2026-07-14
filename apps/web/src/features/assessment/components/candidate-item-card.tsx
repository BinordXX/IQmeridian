'use client';

import type {
  AssessmentResponseValue,
  CandidateSafeAssessmentItem,
} from '../contracts/assessment-contracts';

type CandidateItemCardProps = {
  item: CandidateSafeAssessmentItem;
  responseValue: AssessmentResponseValue;
  onResponseChange: (value: AssessmentResponseValue) => void;
  disabled?: boolean;
};

const shouldShowOptionText = (label: string, text?: string): boolean => {
  if (!text) {
    return false;
  }

  return text.trim().toLowerCase() !== label.trim().toLowerCase();
};

export const CandidateItemCard = ({
  item,
  responseValue,
  onResponseChange,
  disabled = false,
}: CandidateItemCardProps) => {
  const selectedOptionId =
    typeof responseValue === 'string' ? responseValue : undefined;

  return (
    <article className="rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:rounded-[2rem] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            {item.itemType.replaceAll('_', ' ')} · Question {item.position}
          </p>

          <h2 className="mt-3 text-lg font-black leading-7 text-white sm:text-xl sm:leading-8">
            {item.stem}
          </h2>

          {item.prompt && item.prompt.trim() !== item.stem.trim() ? (
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {item.prompt}
            </p>
          ) : null}
        </div>

        {item.timeLimitSeconds ? (
          <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
            {Math.round(item.timeLimitSeconds / 60)} min
          </span>
        ) : null}
      </div>

      {item.stimulus ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Stimulus
          </p>

          {item.stimulus.kind === 'image' ? (
            <img
              src={item.stimulus.content}
              alt={item.stimulus.altText ?? 'Assessment stimulus'}
              className="mt-3 max-h-80 rounded-lg object-contain"
            />
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {item.stimulus.content}
            </p>
          )}
        </section>
      ) : null}

      <fieldset className="mt-6 space-y-3" disabled={disabled}>
        <legend className="sr-only">Answer options</legend>

        {item.options.map((option) => {
          const isSelected = selectedOptionId === option.optionId;

          return (
            <label
              key={option.optionId}
              className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                isSelected
                  ? 'border-cyan-300 bg-cyan-400/15 text-cyan-50'
                  : 'border-white/10 bg-[#020817]/70 text-slate-300 hover:border-cyan-300/35 hover:bg-cyan-400/10'
              } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              <input
                type="radio"
                name={item.itemId}
                value={option.optionId}
                checked={isSelected}
                onChange={() => onResponseChange(option.optionId)}
                className="mt-1 h-4 w-4 accent-cyan-300"
              />

              <span className="flex-1">
                <span className="font-black text-white">{option.label}</span>

                {shouldShowOptionText(option.label, option.text) ? (
                  <span className="ml-2 text-sm leading-6 text-slate-400">
                    {option.text}
                  </span>
                ) : null}

                {option.imageUrl ? (
                  <img
                    src={option.imageUrl}
                    alt={`Option ${option.label}`}
                    className="mt-3 max-h-40 rounded-lg object-contain"
                  />
                ) : null}
              </span>
            </label>
          );
        })}
      </fieldset>
    </article>
  );
};
