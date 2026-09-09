'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type CandidateResultVisibility = 'COMPLETION_ONLY' | 'SUMMARY_ONLY';

type EmployerResultVisibilityControlProps = {
  campaignId: string;
  campaignStatus: string;
  candidateResultVisibility?: string | null;
};

const getNormalisedVisibility = (
  value?: string | null
): CandidateResultVisibility => {
  return value === 'SUMMARY_ONLY' ? 'SUMMARY_ONLY' : 'COMPLETION_ONLY';
};

const getVisibilityCopy = (visibility: CandidateResultVisibility) => {
  if (visibility === 'SUMMARY_ONLY') {
    return {
      title: 'Limited candidate summary enabled',
      body: 'Candidates may see a restrained result summary after completion. Item-level answers, raw psychometric evidence, and employer-only reports remain hidden.',
    };
  }

  return {
    title: 'Candidate results hidden',
    body: 'Candidates see submission confirmation only. Employer-facing reports and scored campaign results remain available to authorised employer users.',
  };
};

export const EmployerResultVisibilityControl = ({
  campaignId,
  campaignStatus,
  candidateResultVisibility,
}: EmployerResultVisibilityControlProps) => {
  const router = useRouter();

  const [selectedVisibility, setSelectedVisibility] =
    useState<CandidateResultVisibility>(
      getNormalisedVisibility(candidateResultVisibility)
    );
  const [savedVisibility, setSavedVisibility] =
    useState<CandidateResultVisibility>(
      getNormalisedVisibility(candidateResultVisibility)
    );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCopy = getVisibilityCopy(selectedVisibility);
  const hasChanges = selectedVisibility !== savedVisibility;

  const saveVisibility = async () => {
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
        )}/candidate-result-visibility`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateResultVisibility: selectedVisibility,
          }),
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string | string[];
          error?: string;
        } | null;

        const message = Array.isArray(payload?.message)
          ? payload.message.join(' ')
          : payload?.message;

        throw new Error(
          message ??
            payload?.error ??
            `Visibility update failed with status ${response.status}`
        );
      }

      setSavedVisibility(selectedVisibility);
      setStatusMessage('Candidate result visibility updated.');
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Candidate result visibility could not be updated.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
        Candidate result visibility
      </p>

      <h3 className="mt-3 text-lg font-black text-white">
        Control what candidates see after completion
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        Employer-facing results remain available to authorised employer users.
        This setting only controls whether candidates receive a limited
        candidate-facing summary after submitting the assessment.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_220px]">
        <div>
          <label
            htmlFor="candidate-result-visibility"
            className="text-sm font-black text-cyan-100"
          >
            Candidate result access
          </label>

          <select
            id="candidate-result-visibility"
            value={selectedVisibility}
            onChange={(event) =>
              setSelectedVisibility(
                event.currentTarget.value as CandidateResultVisibility
              )
            }
            className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#020817] px-4 py-3 text-sm font-black text-white outline-none transition focus:border-cyan-300/50"
          >
            <option value="COMPLETION_ONLY">
              Hide candidate results after completion
            </option>
            <option value="SUMMARY_ONLY">
              Show limited summary after completion
            </option>
          </select>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm">
          <p className="font-black text-white">Current campaign state</p>
          <p className="mt-1 text-slate-400">{campaignStatus}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
        <p className="text-sm font-black text-white">{selectedCopy.title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {selectedCopy.body}
        </p>
      </div>

      {statusMessage ? (
        <p className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="button"
        onClick={saveVisibility}
        disabled={!hasChanges || isSaving}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600 sm:w-auto"
      >
        {isSaving ? 'Saving visibility...' : 'Save visibility setting'}
      </button>
    </section>
  );
};
