'use client';

/* eslint-disable @next/next/no-img-element */

import type {
  AssessmentResponseValue,
  CandidateItemStimulus,
  CandidateSafeAssessmentItem,
} from '../contracts/assessment-contracts';

type AbstractReasoningItemProps = {
  item: CandidateSafeAssessmentItem;
  responseValue: AssessmentResponseValue;
  onResponseChange: (value: AssessmentResponseValue) => void | Promise<void>;
  disabled?: boolean;
};

const isImageSource = (value: string): boolean => {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/') ||
    value.startsWith('data:image/')
  );
};

const stimulusLabel: Record<CandidateItemStimulus['kind'], string> = {
  text: 'Information',
  image: 'Pattern',
  table: 'Table',
  sequence: 'Sequence',
  pattern: 'Pattern',
};

const AbstractStimulus = ({
  stimulus,
}: {
  stimulus: CandidateItemStimulus;
}) => {
  const label = stimulusLabel[stimulus.kind];

  if (stimulus.kind === 'image' || isImageSource(stimulus.content)) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <div className="mt-4 flex justify-center rounded-xl bg-white p-4">
          <img
            src={stimulus.content}
            alt={stimulus.altText ?? 'Abstract reasoning pattern'}
            className="max-h-[420px] max-w-full object-contain"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-7 text-slate-800">
        {stimulus.content}
      </pre>
    </section>
  );
};

export const AbstractReasoningItem = ({
  item,
  responseValue,
  onResponseChange,
  disabled = false,
}: AbstractReasoningItemProps) => {
  const selectedOptionId =
    typeof responseValue === 'string' ? responseValue : undefined;

  const hasVisualOptions = item.options.some((option) => option.imageUrl);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Abstract reasoning · Question {item.position}
          </p>

          <h2 className="mt-3 text-xl font-semibold leading-8 text-slate-950">
            {item.stem}
          </h2>

          {item.prompt ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {item.prompt}
            </p>
          ) : null}
        </div>

        {item.timeLimitSeconds ? (
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {Math.round(item.timeLimitSeconds / 60)} min
          </span>
        ) : null}
      </div>

      {item.stimulus ? <AbstractStimulus stimulus={item.stimulus} /> : null}

      <fieldset className="mt-6" disabled={disabled}>
        <legend className="text-sm font-semibold text-slate-950">
          Select the option that best completes the pattern.
        </legend>

        {item.options.length === 0 ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No answer options were returned for this item.
          </p>
        ) : (
          <div
            className={
              hasVisualOptions
                ? 'mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
                : 'mt-4 space-y-3'
            }
          >
            {item.options.map((option) => {
              const isSelected = selectedOptionId === option.optionId;

              return (
                <label
                  key={option.optionId}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-slate-950 bg-slate-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <input
                    type="radio"
                    name={item.itemId}
                    value={option.optionId}
                    checked={isSelected}
                    onChange={() => onResponseChange(option.optionId)}
                    className="mt-1 h-4 w-4"
                  />

                  <span className="flex-1">
                    <span className="font-semibold text-slate-950">
                      {option.label}
                    </span>

                    {option.text ? (
                      <span className="ml-2 text-sm leading-6 text-slate-700">
                        {option.text}
                      </span>
                    ) : null}

                    {option.imageUrl ? (
                      <span className="mt-3 flex justify-center rounded-xl bg-slate-50 p-3">
                        <img
                          src={option.imageUrl}
                          alt={`Option ${option.label}`}
                          className="max-h-48 max-w-full object-contain"
                        />
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>
    </article>
  );
};
