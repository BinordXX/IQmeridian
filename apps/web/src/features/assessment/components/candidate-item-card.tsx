"use client";

import type {
  AssessmentResponseValue,
  CandidateSafeAssessmentItem,
} from "../contracts/assessment-contracts";

type CandidateItemCardProps = {
  item: CandidateSafeAssessmentItem;
  responseValue: AssessmentResponseValue;
  onResponseChange: (value: AssessmentResponseValue) => void;
  disabled?: boolean;
};

export const CandidateItemCard = ({
  item,
  responseValue,
  onResponseChange,
  disabled = false,
}: CandidateItemCardProps) => {
  const selectedOptionId =
    typeof responseValue === "string" ? responseValue : undefined;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Question {item.position}
          </p>

          <h2 className="mt-3 text-xl font-semibold leading-8 text-slate-950">
            {item.stem}
          </h2>

          {item.prompt ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {item.prompt}
            </p>
          ) : null}
        </div>

        {item.timeLimitSeconds ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {Math.round(item.timeLimitSeconds / 60)} min
          </span>
        ) : null}
      </div>

      {item.stimulus ? (
        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Stimulus
          </p>

          {item.stimulus.kind === "image" ? (
            <img
              src={item.stimulus.content}
              alt={item.stimulus.altText ?? "Assessment stimulus"}
              className="mt-3 max-h-80 rounded-lg object-contain"
            />
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
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
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                isSelected
                  ? "border-slate-950 bg-slate-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
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
                <span className="font-medium text-slate-950">
                  {option.label}
                </span>

                {option.text ? (
                  <span className="ml-2 text-sm leading-6 text-slate-700">
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