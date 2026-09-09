import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getDefaultDashboardForRole, isAppRole } from '@/lib/role-routing';

import {
  listConsumerSessionsWithPsychometricScores,
  type ConsumerPsychometricScoreResult,
  type ConsumerSessionSummary,
} from '../consumer-dashboard-api';

type DashboardHistoryPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

const PAGE_SIZE = 10;

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const formatScoreBand = (value?: string | null) => {
  if (!value) return 'Unavailable';

  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatWholeNumber = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return Math.round(value).toString();
};

const formatPercentile = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return `${Math.round(value)}th`;
};

const getTimestampValue = (value?: string | null) => {
  if (!value) return 0;

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
};

const isCompletedSession = (session: ConsumerSessionSummary) => {
  return session.status === 'COMPLETED' || session.status === 'FINALISED';
};

const getSessionTitle = (session: ConsumerSessionSummary) => {
  return (
    session.assessmentForm?.name ??
    session.assessmentForm?.title ??
    session.campaign?.name ??
    'IQMeridian assessment'
  );
};

const getPrimaryIqScore = (score?: ConsumerPsychometricScoreResult | null) => {
  return score?.overallIqScore ?? score?.overallStandardScore ?? null;
};

const getPrimaryIqPercentile = (
  score?: ConsumerPsychometricScoreResult | null
) => {
  return score?.overallIqPercentile ?? score?.overallPercentile ?? null;
};

const getValidityLabel = (score?: ConsumerPsychometricScoreResult | null) => {
  const flags = score?.validityFlags ?? [];

  if (flags.some((flag) => flag.severity === 'HIGH')) {
    return 'Low validity';
  }

  if (flags.some((flag) => flag.severity === 'MEDIUM')) {
    return 'Caution';
  }

  if (flags.some((flag) => flag.severity === 'LOW')) {
    return 'Minor notice';
  }

  return 'Clean';
};

const getValidityClassName = (
  score?: ConsumerPsychometricScoreResult | null
) => {
  const flags = score?.validityFlags ?? [];

  if (flags.some((flag) => flag.severity === 'HIGH')) {
    return 'border-red-300/20 bg-red-400/10 text-red-100';
  }

  if (flags.some((flag) => flag.severity === 'MEDIUM')) {
    return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
  }

  if (flags.some((flag) => flag.severity === 'LOW')) {
    return 'border-blue-300/20 bg-blue-400/10 text-blue-100';
  }

  return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
};

export default async function DashboardHistoryPage({
  searchParams,
}: DashboardHistoryPageProps) {
  const session = await auth();
  const role = session?.user?.role;
  const resolvedSearchParams = await searchParams;

  if (!session?.user || !isAppRole(role)) {
    redirect('/login?callbackUrl=/dashboard/history');
  }

  if (role !== 'CONSUMER') {
    redirect(getDefaultDashboardForRole(role));
  }

  const rawPage = Number(resolvedSearchParams?.page ?? '1');
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  let sessions: ConsumerSessionSummary[] = [];
  let pageError: string | null = null;

  try {
    sessions = await listConsumerSessionsWithPsychometricScores();
  } catch (error) {
    pageError =
      error instanceof Error ? error.message : 'Unable to load result history.';
  }

  const scoredSessions = sessions
    .filter(isCompletedSession)
    .filter((assessmentSession) => assessmentSession.psychometricScore)
    .sort((left, right) => {
      const leftScore = left.psychometricScore;
      const rightScore = right.psychometricScore;

      return (
        getTimestampValue(
          rightScore?.generatedAt ?? right.completedAt ?? right.updatedAt
        ) -
        getTimestampValue(
          leftScore?.generatedAt ?? left.completedAt ?? left.updatedAt
        )
      );
    });

  const pageCount = Math.max(1, Math.ceil(scoredSessions.length / PAGE_SIZE));
  const boundedPage = Math.min(currentPage, pageCount);
  const startIndex = (boundedPage - 1) * PAGE_SIZE;
  const pageItems = scoredSessions.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              Result history
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              IQ Score history
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Review completed IQMeridian assessment attempts in a controlled
              table. Open an individual profile when you need the full result
              context.
            </p>
          </div>

          <Link
            className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">
          {pageError}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-white">
              Completed scored attempts
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Showing {pageItems.length} of {scoredSessions.length} scored
              result{scoredSessions.length === 1 ? '' : 's'}.
            </p>
          </div>

          <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-slate-300">
            Page {boundedPage} of {pageCount}
          </span>
        </div>

        {pageItems.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <div className="hidden grid-cols-[1.5fr_0.8fr_0.8fr_0.9fr_0.9fr_0.7fr] gap-4 border-b border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:grid">
              <span>Assessment</span>
              <span>IQ Score</span>
              <span>Percentile</span>
              <span>Band</span>
              <span>Validity</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-white/10">
              {pageItems.map((assessmentSession) => {
                const score = assessmentSession.psychometricScore;
                const iqScore = getPrimaryIqScore(score);
                const percentile = getPrimaryIqPercentile(score);

                return (
                  <div
                    className="grid gap-4 px-4 py-4 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.9fr_0.9fr_0.7fr] lg:items-center"
                    key={assessmentSession.id}
                  >
                    <div>
                      <p className="font-black text-white">
                        {getSessionTitle(assessmentSession)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Completed {formatDate(assessmentSession.completedAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                        IQ Score
                      </p>
                      <p className="text-2xl font-black text-cyan-100 lg:text-lg">
                        {formatWholeNumber(iqScore)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                        Percentile
                      </p>
                      <p className="font-black text-white">
                        {formatPercentile(percentile)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                        Band
                      </p>
                      <p className="font-black text-white">
                        {formatScoreBand(score?.overallScoreBand)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                        Validity
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getValidityClassName(
                          score
                        )}`}
                      >
                        {getValidityLabel(score)}
                      </span>
                    </div>

                    <div className="lg:text-right">
                      <Link
                        className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15"
                        href={`/dashboard/history/${assessmentSession.id}`}
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.035] p-6">
            <h3 className="font-black text-white">No scored results yet</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Completed IQ Score results will appear here after scoring is
              available.
            </p>
          </div>
        )}

        {pageCount > 1 ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              aria-disabled={boundedPage <= 1}
              className={`rounded-2xl border px-4 py-2 text-sm font-black ${
                boundedPage <= 1
                  ? 'pointer-events-none border-white/10 bg-white/[0.03] text-slate-600'
                  : 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15'
              }`}
              href={`/dashboard/history?page=${boundedPage - 1}`}
            >
              Previous
            </Link>

            <p className="text-sm font-bold text-slate-500">
              {startIndex + 1}-
              {Math.min(startIndex + PAGE_SIZE, scoredSessions.length)} of{' '}
              {scoredSessions.length}
            </p>

            <Link
              aria-disabled={boundedPage >= pageCount}
              className={`rounded-2xl border px-4 py-2 text-sm font-black ${
                boundedPage >= pageCount
                  ? 'pointer-events-none border-white/10 bg-white/[0.03] text-slate-600'
                  : 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15'
              }`}
              href={`/dashboard/history?page=${boundedPage + 1}`}
            >
              Next
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
