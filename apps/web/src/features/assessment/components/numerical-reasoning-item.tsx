'use client';

/* eslint-disable @next/next/no-img-element */

import type {
  AssessmentResponseValue,
  CandidateItemStimulus,
  CandidateSafeAssessmentItem,
} from '../contracts/assessment-contracts';

type NumericalReasoningItemProps = {
  item: CandidateSafeAssessmentItem;
  responseValue: AssessmentResponseValue;
  onResponseChange: (value: AssessmentResponseValue) => void | Promise<void>;
  disabled?: boolean;
};

type NumericalTableCell = string | number;
type NumericalTableRow = Record<string, NumericalTableCell>;

const isImageSource = (value: string): boolean => {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/') ||
    value.startsWith('data:image/')
  );
};

const isNumericalTableCell = (value: unknown): value is NumericalTableCell => {
  return typeof value === 'string' || typeof value === 'number';
};

const isNumericalTableRow = (value: unknown): value is NumericalTableRow => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isNumericalTableCell);
};

const parseTableRows = (content: string): NumericalTableRow[] | null => {
  try {
    const parsed = JSON.parse(content) as unknown;

    if (!Array.isArray(parsed) || !parsed.every(isNumericalTableRow)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const stimulusLabel: Record<CandidateItemStimulus['kind'], string> = {
  text: 'Information',
  image: 'Chart or figure',
  table: 'Data table',
  sequence: 'Sequence',
  pattern: 'Pattern',
};

const shouldShowOptionText = (label: string, text?: string): boolean => {
  if (!text) {
    return false;
  }

  return text.trim().toLowerCase() !== label.trim().toLowerCase();
};

const NumericalStimulus = ({
  stimulus,
}: {
  stimulus: CandidateItemStimulus;
}) => {
  const label = stimulusLabel[stimulus.kind];
  const tableRows =
    stimulus.kind === 'table' ? parseTableRows(stimulus.content) : null;

  if (tableRows && tableRows.length > 0) {
    const columns = Object.keys(tableRows[0] ?? {});

    return (
      <section className="mt-6 rounded-2xl border border-cyan-300/15 bg-[#020817]/75 p-4 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
          {label}
        </p>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#07142f]/80">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-cyan-400/10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-4 py-3 text-left font-black text-cyan-100"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {tableRows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${JSON.stringify(row)}`}>
                  {columns.map((column) => (
                    <td key={column} className="px-4 py-3 text-slate-300">
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (stimulus.kind === 'image' || isImageSource(stimulus.content)) {
    return (
      <section className="mt-6 rounded-2xl border border-cyan-300/15 bg-[#020817]/75 p-4 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
          {label}
        </p>

        <div className="mt-4 flex justify-center rounded-2xl border border-white/10 bg-[#07142f]/80 p-3 sm:p-4">
          <img
            src={stimulus.content}
            alt={stimulus.altText ?? 'Numerical reasoning stimulus'}
            className="max-h-[360px] max-w-full object-contain sm:max-h-[420px]"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-cyan-300/15 bg-[#020817]/75 p-4 sm:p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
        {label}
      </p>

      <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#07142f]/80 p-4 text-sm leading-7 text-slate-300">
        {stimulus.content}
      </pre>
    </section>
  );
};

export const NumericalReasoningItem = ({
  item,
  responseValue,
  onResponseChange,
  disabled = false,
}: NumericalReasoningItemProps) => {
  const selectedOptionId =
    typeof responseValue === 'string' ? responseValue : undefined;

  return (
    <article className="rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:rounded-[2rem] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Numerical reasoning · Question {item.position}
          </p>

          <h2 className="mt-3 text-lg font-black leading-7 text-white sm:text-xl sm:leading-8">
            {item.stem}
          </h2>

          {item.prompt && item.prompt.trim() !== item.stem.trim() ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              {item.prompt}
            </p>
          ) : null}
        </div>

        {item.timeLimitSeconds ? (
          <span className="w-fit rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
            {Math.round(item.timeLimitSeconds / 60)} min
          </span>
        ) : null}
      </div>

      {item.stimulus ? <NumericalStimulus stimulus={item.stimulus} /> : null}

      <fieldset className="mt-6" disabled={disabled}>
        <legend className="text-sm font-black text-white">
          Select the best answer using the information provided.
        </legend>

        {item.options.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">
            No answer options were returned for this item.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
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
                    className="mt-1 h-5 w-5 shrink-0 accent-cyan-300"
                  />

                  <span className="flex-1">
                    <span className="font-black text-white">
                      {option.label}
                    </span>

                    {shouldShowOptionText(option.label, option.text) ? (
                      <span className="ml-2 text-sm leading-6 text-slate-400">
                        {option.text}
                      </span>
                    ) : null}

                    {option.imageUrl ? (
                      <span className="mt-3 flex justify-center rounded-2xl border border-white/10 bg-[#07142f]/80 p-3">
                        <img
                          src={option.imageUrl}
                          alt={`Option ${option.label}`}
                          className="max-h-44 max-w-full object-contain sm:max-h-48"
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
