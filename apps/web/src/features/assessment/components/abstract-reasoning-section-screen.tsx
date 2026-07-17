'use client';

import type {
  AssessmentResponseValue,
  CandidateSafeAssessmentItem,
} from '../contracts/assessment-contracts';
import { AbstractReasoningItem } from './abstract-reasoning-item';

type AbstractReasoningSectionScreenProps = {
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

export const AbstractReasoningSectionScreen = ({
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
}: AbstractReasoningSectionScreenProps) => {
  const isFirstItem = currentItemIndex <= 0;
  const isLastItem = currentItemIndex === totalItems - 1;
  const controlsDisabled = isSaving || isSubmitting;

  return (
    <section>
      <div className="mb-5 rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:mb-6 sm:rounded-[2rem] sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          Current section
        </p>

        <h2 className="mt-2 text-lg font-black text-white">
          {sectionTitle ?? 'Abstract reasoning'}
        </h2>

        {sectionInstructions ? (
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {sectionInstructions}
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Identify the underlying pattern and select the option that best
            completes the item.
          </p>
        )}
      </div>

      <AbstractReasoningItem
        item={item}
        responseValue={responseValue}
        onResponseChange={onResponseChange}
        disabled={isSubmitting}
      />

      <div className="mt-5 flex flex-col gap-3 rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:mt-6 sm:rounded-[2rem] sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirstItem || controlsDisabled}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <p className="text-center text-sm font-bold text-slate-400">
          Question {currentItemIndex + 1} of {totalItems}
        </p>

        {isLastItem ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={controlsDisabled}
            className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Submitting...' : 'Submit assessment'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={controlsDisabled}
            className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        )}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold text-red-100">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
};
