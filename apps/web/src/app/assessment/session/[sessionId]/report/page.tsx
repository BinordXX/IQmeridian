import { redirect } from 'next/navigation';

import { CandidateResultSummary } from '@/features/assessment/components/candidate-result-summary';

type CandidateAudience = 'employer-invited' | 'consumer';

type CandidateSummaryApiResponse = {
  visibility: 'summary' | 'hidden';
  audience?: CandidateAudience;
  overallBand?: string;
  abstractReasoningBand?: string;
  numericalReasoningBand?: string;
};

type CandidateReportPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

const getApiBaseUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    'http://localhost:3001'
  );
};

const normaliseAudience = (audience?: string): CandidateAudience => {
  return audience === 'consumer' ? 'consumer' : 'employer-invited';
};

const getCandidateSummary = async (
  sessionId: string
): Promise<CandidateSummaryApiResponse | null> => {
  const response = await fetch(
    `${getApiBaseUrl()}/assessment/sessions/${encodeURIComponent(
      sessionId
    )}/candidate-summary`,
    {
      cache: 'no-store',
    }
  );

  if (response.status === 401 || response.status === 403) {
    redirect('/assessment/status?reason=unauthorised');
  }

  if (response.status === 404) {
    redirect('/assessment/status?reason=not-found');
  }

  if (response.status === 409) {
    redirect('/assessment/status?reason=invalid');
  }

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as CandidateSummaryApiResponse;
};

export default async function CandidateReportPage({
  params,
}: CandidateReportPageProps) {
  const { sessionId } = await params;
  const summary = await getCandidateSummary(sessionId);

  if (!summary) {
    redirect('/assessment/status?reason=error');
  }

  if (summary.visibility !== 'summary') {
    redirect(
      `/assessment/status?reason=completed&sessionId=${encodeURIComponent(
        sessionId
      )}&resultVisibility=hidden`
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <CandidateResultSummary
          overallBand={summary.overallBand ?? 'Not available'}
          abstractReasoningBand={
            summary.abstractReasoningBand ?? 'Not available'
          }
          numericalReasoningBand={
            summary.numericalReasoningBand ?? 'Not available'
          }
          audience={normaliseAudience(summary.audience)}
        />
      </div>
    </main>
  );
}
