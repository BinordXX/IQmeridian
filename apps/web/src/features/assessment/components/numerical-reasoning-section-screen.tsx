'use client';

import type {
  AssessmentResponseValue,
  CandidateSafeAssessmentItem,
} from '../contracts/assessment-contracts';
import { NumericalReasoningItem } from './numerical-reasoning-item';

type NumericalReasoningSectionScreenProps = {
  sectionTitle?: string | undefined;
  sectionInstructions?: string | undefined;
  item: CandidateSafeAssessmentItem;
  responseValue: AssessmentResponseValue;
  currentItemIndex: number;
  totalItems: number;
  isSaving: boolean;
  isSubmitting: boolean;
  errorMessage?: string | undefined;
  onResponseChange: (value: AssessmentResponseValue) => void | Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void | Promise<void>;
};

export const NumericalReasoningSectionScreen = ({
  sectionTitle,
  sectionInstructions,
  item,
  responseValue,
  currentItemIndex,
  totalItems,
  isSaving,
  isSubmitting,
  errorMessage,
  onResponseChange,
  onPrevious,
  onNext,
  onSubmit,
}: NumericalReasoningSectionScreenProps) => {
  const isFirstItem = currentItemIndex <= 0;
  const isLastItem = currentItemIndex === totalItems - 1;
  const controlsDisabled = isSaving || isSubmitting;

  return (
    <section>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Current section
        </p>

        <h2 className="mt-2 text-lg font-semibold text-slate-950">
          {sectionTitle ?? 'Numerical reasoning'}
        </h2>

        {sectionInstructions ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {sectionInstructions}
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the data, figures, or statements provided to select the most
            appropriate answer. Work carefully and avoid assumptions not
            supported by the item.
          </p>
        )}
      </div>

      <NumericalReasoningItem
        item={item}
        responseValue={responseValue}
        onResponseChange={onResponseChange}
        disabled={isSubmitting}
      />

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirstItem || controlsDisabled}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <p className="text-center text-sm font-medium text-slate-500">
          Question {currentItemIndex + 1} of {totalItems}
        </p>

        {isLastItem ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={controlsDisabled}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Submitting...' : 'Submit assessment'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={controlsDisabled}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Next
          </button>
        )}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
};
