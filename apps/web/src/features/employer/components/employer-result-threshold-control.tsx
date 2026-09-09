'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type {
  CandidateResultThresholdConfig,
  PsychometricScoreBand,
} from '../api/employer-dashboard-api';
import { psychometricScoreBandOptions } from '../api/employer-dashboard-api';
import { normaliseCandidateResultThresholdConfig } from '../utils/employer-candidate-thresholds';

type EmployerResultThresholdControlProps = {
  campaignId: string;
  campaignStatus: string;
  thresholdConfig?: CandidateResultThresholdConfig | null;
};

const nullableBand = (value: string): PsychometricScoreBand | null => {
  return value ? (value as PsychometricScoreBand) : null;
};

export const EmployerResultThresholdControl = ({
  campaignId,
  campaignStatus,
  thresholdConfig,
}: EmployerResultThresholdControlProps) => {
  const router = useRouter();
  const [formState, setFormState] = useState<CandidateResultThresholdConfig>(
    normaliseCandidateResultThresholdConfig(thresholdConfig)
  );
  const [savedState, setSavedState] = useState<CandidateResultThresholdConfig>(
    normaliseCandidateResultThresholdConfig(thresholdConfig)
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = JSON.stringify(formState) !== JSON.stringify(savedState);

  const updateFormState = <Key extends keyof CandidateResultThresholdConfig>(
    key: Key,
    value: CandidateResultThresholdConfig[Key]
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasChanges || isSaving) {
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/employer/campaigns/${encodeURIComponent(
          campaignId
        )}/candidate-result-thresholds`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formState),
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string | string[];
          error?: string;
        };

        const message = Array.isArray(payload.message)
          ? payload.message.join(' ')
          : payload.message;

        throw new Error(
          message ??
            payload.error ??
            `Threshold update failed with status ${response.status}`
        );
      }

      setSavedState(formState);
      setStatusMessage('Candidate result filters were updated.');
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Candidate result filters could not be updated.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Candidate filters
          </p>

          <h3 className="mt-2 text-lg font-black text-white">
            Employer threshold controls
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Configure non-destructive campaign filters. These settings classify
            candidates for review; they do not reject, delete, or hide candidate
            records.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
          {campaignStatus}
        </span>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <label className="flex items-start gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
          <input
            type="checkbox"
            checked={formState.enabled}
            onChange={(event) => {
              updateFormState('enabled', event.currentTarget.checked);
            }}
            className="mt-1 h-4 w-4 accent-cyan-300"
          />

          <span>
            <span className="block text-sm font-black text-cyan-50">
              Enable candidate threshold filters
            </span>
            <span className="mt-1 block text-sm leading-6 text-cyan-100/70">
              When enabled, completed scored candidates are classified as meets
              filter, below filter, or review required.
            </span>
          </span>
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-black text-slate-300">
              Minimum overall band
            </span>
            <select
              value={formState.minimumOverallBand ?? ''}
              onChange={(event) => {
                updateFormState(
                  'minimumOverallBand',
                  nullableBand(event.currentTarget.value)
                );
              }}
              className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
            >
              <option value="">No minimum</option>
              {psychometricScoreBandOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-300">
              Minimum abstract band
            </span>
            <select
              value={formState.minimumAbstractReasoningBand ?? ''}
              onChange={(event) => {
                updateFormState(
                  'minimumAbstractReasoningBand',
                  nullableBand(event.currentTarget.value)
                );
              }}
              className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
            >
              <option value="">No minimum</option>
              {psychometricScoreBandOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-300">
              Minimum numerical band
            </span>
            <select
              value={formState.minimumNumericalReasoningBand ?? ''}
              onChange={(event) => {
                updateFormState(
                  'minimumNumericalReasoningBand',
                  nullableBand(event.currentTarget.value)
                );
              }}
              className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
            >
              <option value="">No minimum</option>
              {psychometricScoreBandOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
            <input
              type="checkbox"
              checked={formState.hideUnscoredFromFilteredView}
              onChange={(event) => {
                updateFormState(
                  'hideUnscoredFromFilteredView',
                  event.currentTarget.checked
                );
              }}
              className="mt-1 h-4 w-4 accent-cyan-300"
            />

            <span>
              <span className="block text-sm font-black text-white">
                Separate unscored candidates
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-400">
                Keep candidates without psychometric scores outside the filtered
                candidate group.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
            <input
              type="checkbox"
              checked={formState.requireNoHighSeverityValidityFlags}
              onChange={(event) => {
                updateFormState(
                  'requireNoHighSeverityValidityFlags',
                  event.currentTarget.checked
                );
              }}
              className="mt-1 h-4 w-4 accent-cyan-300"
            />

            <span>
              <span className="block text-sm font-black text-white">
                Require no high-severity flags
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-400">
                Candidates with high or critical validity flags are moved to
                review required.
              </span>
            </span>
          </label>
        </div>

        {statusMessage ? (
          <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100">
            {statusMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!hasChanges || isSaving}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Saving filters...' : 'Save threshold filters'}
        </button>
      </form>
    </section>
  );
};
