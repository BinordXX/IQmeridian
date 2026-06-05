'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { generateEmployerReport } from '../api/employer-dashboard-api';

type EmployerReportActionsProps = {
  campaignId: string;
  candidateId: string;
  sessionId?: string;
  canGenerateReport: boolean;
};

export const EmployerReportActions = ({
  campaignId,
  candidateId,
  sessionId,
  canGenerateReport,
}: EmployerReportActionsProps) => {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reportHref = `/employer/campaigns/${encodeURIComponent(
    campaignId
  )}/candidates/${encodeURIComponent(candidateId)}/report`;

  const generateReport = async () => {
    if (!sessionId || !canGenerateReport || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      await generateEmployerReport(sessionId);
      router.push(reportHref);
      router.refresh();
    } catch {
      setErrorMessage(
        'The report could not be generated. Confirm that the session is completed and scoring is available.'
      );
      setIsGenerating(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            Candidate report
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Generate or review the employer-facing report for this candidate.
            Reports are only available after the assessment has been completed
            and scored.
          </p>

          {errorMessage ? (
            <p className="mt-3 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generateReport}
            disabled={!sessionId || !canGenerateReport || isGenerating}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isGenerating ? 'Generating report...' : 'Generate report'}
          </button>

          <Link
            href={reportHref}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View report
          </Link>
        </div>
      </div>
    </section>
  );
};
