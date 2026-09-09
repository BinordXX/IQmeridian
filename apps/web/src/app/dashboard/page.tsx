import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  PlayCircle,
  Settings,
  Trophy,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getDefaultDashboardForRole, isAppRole } from '@/lib/role-routing';

import { CandidatePendingInvitationsPanel } from './_components/candidate-pending-invitations-panel';
import {
  startConsumerAssessmentAction,
  updateLeaderboardPreferencesAction,
} from './actions';
import {
  listCandidatePendingInvitations,
  type CandidatePendingInvitationSummary,
} from './candidate-dashboard-api';
import {
  getConsumerAssessmentDefault,
  getMyLeaderboardSummary,
  listConsumerSessionsWithPsychometricScores,
  type ConsumerAssessmentDefault,
  type ConsumerPsychometricDomainScore,
  type ConsumerPsychometricScoreResult,
  type ConsumerSessionSummary,
  type ConsumerLeaderboardSummary,
} from './consumer-dashboard-api';

type DashboardPageProps = {
  searchParams?: Promise<{
    startError?: string;
  }>;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const formatRank = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not ranked';

  return `#${value}`;
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

const formatAccuracy = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return `${Math.round(value * 100)}%`;
};

const formatPercentile = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return `${Math.round(value)}th percentile`;
};

const getTimestampValue = (value?: string | null) => {
  if (!value) return 0;

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
};

const isCompletedSession = (session: ConsumerSessionSummary) => {
  return session.status === 'COMPLETED' || session.status === 'FINALISED';
};

const isActiveSession = (session: ConsumerSessionSummary) => {
  return session.status === 'NOT_STARTED' || session.status === 'IN_PROGRESS';
};

const getPrimaryIqScore = (score?: ConsumerPsychometricScoreResult | null) => {
  return score?.overallIqScore ?? score?.overallStandardScore ?? null;
};

const getPrimaryIqPercentile = (
  score?: ConsumerPsychometricScoreResult | null
) => {
  return score?.overallIqPercentile ?? score?.overallPercentile ?? null;
};

const formatIqScoreInterval = (
  score?: ConsumerPsychometricScoreResult | null
) => {
  if (
    typeof score?.overallIqCi90Lower === 'number' &&
    typeof score.overallIqCi90Upper === 'number'
  ) {
    return `${Math.round(score.overallIqCi90Lower)}-${Math.round(
      score.overallIqCi90Upper
    )}`;
  }

  if (
    typeof score?.overallCi90Lower === 'number' &&
    typeof score.overallCi90Upper === 'number'
  ) {
    return `${Math.round(100 + score.overallCi90Lower * 15)}-${Math.round(
      100 + score.overallCi90Upper * 15
    )}`;
  }

  return 'Not available';
};

const getDomainIqScore = (
  domainScore?: ConsumerPsychometricDomainScore | null
) => {
  return domainScore?.iqScore ?? domainScore?.standardScore ?? null;
};

const getSignalCount = (score?: ConsumerPsychometricScoreResult | null) => {
  const summary = score?.scoringFeatureSummary;

  if (
    typeof summary === 'object' &&
    summary !== null &&
    !Array.isArray(summary) &&
    'signalCount' in summary
  ) {
    const signalCount = (summary as { signalCount?: unknown }).signalCount;

    if (typeof signalCount === 'number') {
      return signalCount;
    }
  }

  const signals = score?.scoringSignalsUsed;

  if (Array.isArray(signals)) {
    return signals.length;
  }

  return null;
};

const getStrongestDomain = (session?: ConsumerSessionSummary) => {
  const domainScores = session?.psychometricScore?.domainScores ?? [];

  return [...domainScores].sort(
    (left, right) =>
      (getDomainIqScore(right) ?? 0) - (getDomainIqScore(left) ?? 0)
  )[0];
};

const getCurrentProfileSession = (sessions: ConsumerSessionSummary[]) => {
  return sessions
    .filter((sessionRecord) => sessionRecord.psychometricScore)
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
    })[0];
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

  return score ? 'Clean' : 'Not available';
};

const getSessionTitle = (session: ConsumerSessionSummary) => {
  return (
    session.assessmentForm?.name ??
    session.assessmentForm?.title ??
    session.campaign?.name ??
    'IQMeridian assessment'
  );
};

const getSessionHref = (session: ConsumerSessionSummary) => {
  if (session.status === 'IN_PROGRESS') {
    return `/assessment/session/${session.id}`;
  }

  return `/assessment/session/${session.id}/instructions`;
};

const getSessionActionLabel = (session: ConsumerSessionSummary) => {
  if (session.status === 'IN_PROGRESS') return 'Resume';

  return 'Open';
};

const getStatusBadgeClassName = (session: ConsumerSessionSummary) => {
  if (session.status === 'IN_PROGRESS') {
    return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
  }

  if (session.status === 'NOT_STARTED') {
    return 'border-blue-300/20 bg-blue-400/10 text-blue-100';
  }

  if (isCompletedSession(session)) {
    return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
  }

  return 'border-white/10 bg-[#020817]/70 text-slate-300';
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();
  const role = session?.user?.role;
  const resolvedSearchParams = await searchParams;

  if (!session?.user || !isAppRole(role)) {
    redirect('/login?callbackUrl=/dashboard');
  }

  if (role !== 'CONSUMER' && role !== 'CANDIDATE') {
    redirect(getDefaultDashboardForRole(role));
  }

  let consumerAssessment: ConsumerAssessmentDefault | null = null;
  let sessions: ConsumerSessionSummary[] = [];
  let pendingInvitations: CandidatePendingInvitationSummary[] = [];
  let dashboardError: string | null = null;
  let pendingInvitationError: string | null = null;
  let leaderboardSummary: ConsumerLeaderboardSummary | null = null;
  let leaderboardError: string | null = null;

  try {
    if (role === 'CONSUMER') {
      const [assessmentDefault, sessionRecords] = await Promise.all([
        getConsumerAssessmentDefault(),
        listConsumerSessionsWithPsychometricScores(),
      ]);

      consumerAssessment = assessmentDefault;
      sessions = sessionRecords;
    } else {
      const [sessionRecords, invitationRecords] = await Promise.allSettled([
        listConsumerSessionsWithPsychometricScores(),
        listCandidatePendingInvitations(),
      ]);

      if (sessionRecords.status === 'fulfilled') {
        sessions = sessionRecords.value;
      } else {
        dashboardError =
          sessionRecords.reason instanceof Error
            ? sessionRecords.reason.message
            : 'Unable to load dashboard data.';
      }

      if (invitationRecords.status === 'fulfilled') {
        pendingInvitations = invitationRecords.value;
      } else {
        pendingInvitationError =
          invitationRecords.reason instanceof Error
            ? invitationRecords.reason.message
            : 'Unable to load pending invitations.';
      }
    }
  } catch (error) {
    dashboardError =
      error instanceof Error ? error.message : 'Unable to load dashboard data.';
  }
  if (role === 'CONSUMER') {
    try {
      leaderboardSummary = await getMyLeaderboardSummary();
    } catch (error) {
      leaderboardError =
        error instanceof Error
          ? error.message
          : 'Unable to load leaderboard status.';
    }
  }
  const isCandidate = role === 'CANDIDATE';
  const activeSessions = sessions.filter(isActiveSession);
  const completedSessions = sessions.filter(isCompletedSession);
  const scoredCompletedSessions = completedSessions.filter(
    (assessmentSession) => Boolean(assessmentSession.psychometricScore)
  );

  const currentProfileSession =
    role === 'CONSUMER' ? getCurrentProfileSession(sessions) : undefined;
  const currentProfileScore = currentProfileSession?.psychometricScore ?? null;
  const currentProfileIqScore = getPrimaryIqScore(currentProfileScore);
  const currentProfileIqPercentile =
    getPrimaryIqPercentile(currentProfileScore);
  const currentProfileIqInterval = formatIqScoreInterval(currentProfileScore);

  const strongestDomain = getStrongestDomain(currentProfileSession);
  const currentProfileSignalCount = getSignalCount(currentProfileScore);

  const canStartConsumerAssessment =
    role === 'CONSUMER' && Boolean(consumerAssessment);

  const candidateHasCompletedOnly =
    isCandidate && activeSessions.length === 0 && completedSessions.length > 0;
  const candidateHasNoAssignments =
    isCandidate &&
    activeSessions.length === 0 &&
    completedSessions.length === 0 &&
    pendingInvitations.length === 0;

  const assessmentAvailabilityLabel =
    role === 'CONSUMER'
      ? consumerAssessment
        ? 'Available'
        : 'Unavailable'
      : activeSessions.length > 0
        ? 'Assigned'
        : pendingInvitations.length > 0
          ? 'Pending invitation'
          : 'No active assignment';

  const assessmentAvailabilityDescription =
    role === 'CONSUMER'
      ? consumerAssessment
        ? consumerAssessment.assessmentForm.name
        : 'No default consumer assessment has been selected yet.'
      : activeSessions.length > 0
        ? 'You have an assigned assessment session available.'
        : pendingInvitations.length > 0
          ? 'You have a pending invitation waiting to be opened.'
          : 'You do not currently have an active assessment assignment.';

  const startAssessmentDescription =
    role === 'CONSUMER'
      ? consumerAssessment
        ? 'Start a new consumer-owned assessment session. Your completed attempt will update your IQMeridian profile.'
        : 'No consumer assessment is currently available. A platform administrator must select an active default assessment first.'
      : pendingInvitations.length > 0
        ? 'Open your pending invitation to claim it and create your assessment session.'
        : candidateHasCompletedOnly
          ? 'Your assigned assessment has been completed. A new invitation is required for another attempt.'
          : candidateHasNoAssignments
            ? 'Candidate assessments are assigned through invitations or organisation campaigns.'
            : 'Open or resume your currently assigned assessment.';

  return (
    <div className="space-y-6 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.13),transparent_24%)]"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              IQMeridian dashboard
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Welcome, {session.user.name ?? session.user.email}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              {isCandidate
                ? 'This is your controlled candidate workspace for active assignments and completion status.'
                : 'This is your personal IQMeridian command center. Start a test, view your current IQ Score, or open your full test history.'}
            </p>
          </div>

          <Link
            className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
            href="/"
          >
            Home
          </Link>
        </div>
      </section>

      {resolvedSearchParams?.startError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold text-red-100">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <span>{resolvedSearchParams.startError}</span>
        </div>
      ) : null}

      {dashboardError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <span>{dashboardError}</span>
        </div>
      ) : null}

      {isCandidate ? (
        <>
          <CandidatePendingInvitationsPanel
            invitations={pendingInvitations}
            errorMessage={pendingInvitationError}
          />

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                  {activeSessions.length > 0 ? (
                    <PlayCircle size={22} strokeWidth={2} />
                  ) : (
                    <CheckCircle2 size={22} strokeWidth={2} />
                  )}
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                    Candidate access
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    {activeSessions.length > 0
                      ? 'You have an active assigned assessment'
                      : pendingInvitations.length > 0
                        ? 'You have a pending invitation'
                        : candidateHasCompletedOnly
                          ? 'Assessment completed'
                          : 'No active assessment'}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    {startAssessmentDescription}
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-100">
                {assessmentAvailabilityLabel}
              </span>
            </div>

            {activeSessions.length > 0 ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {activeSessions.map((assessmentSession) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                    key={assessmentSession.id}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-black text-white">
                          {getSessionTitle(assessmentSession)}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Created: {formatDate(assessmentSession.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getStatusBadgeClassName(
                            assessmentSession
                          )}`}
                        >
                          {assessmentSession.status}
                        </span>
                        <Link
                          className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15"
                          href={getSessionHref(assessmentSession)}
                        >
                          {getSessionActionLabel(assessmentSession)}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Current IQMeridian profile
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                {currentProfileScore
                  ? 'Your current IQ Score'
                  : 'Profile not available yet'}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                {currentProfileScore
                  ? 'The dashboard shows only the current headline result. Full attempt history and detailed profiles live under Test History.'
                  : 'Complete an assessment to generate your current IQMeridian IQ Score profile.'}
              </p>
            </div>

            <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-slate-300">
              {currentProfileScore
                ? `Updated ${formatDate(currentProfileScore.generatedAt)}`
                : 'Awaiting first score'}
            </span>
          </div>

          <div className="mt-8 rounded-[2rem] border border-cyan-300/20 bg-[#020817]/80 p-6 text-center shadow-[0_24px_80px_rgba(8,145,178,0.12)]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
              IQ Score
            </p>
            <p className="mt-4 text-7xl font-black tracking-tight text-white md:text-8xl">
              {formatWholeNumber(currentProfileIqScore)}
            </p>
            <p className="mt-4 text-sm font-bold text-slate-300">
              IQMeridian IQ Score
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Percentile
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  {formatPercentile(currentProfileIqPercentile)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  90% IQ interval
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  {currentProfileIqInterval}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Cognitive band
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  {currentProfileScore
                    ? formatScoreBand(currentProfileScore.overallScoreBand)
                    : 'Not available'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Validity
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  {getValidityLabel(currentProfileScore)}
                </p>
              </div>
            </div>

            {currentProfileScore ? (
              <div className="mt-6">
                <Link
                  className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
                  href="/dashboard/history"
                >
                  Open Test History
                </Link>
              </div>
            ) : null}
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Accuracy
              </dt>
              <dd className="mt-2 text-2xl font-black text-white">
                {formatAccuracy(currentProfileScore?.overallAccuracy)}
              </dd>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Strongest domain
              </dt>
              <dd className="mt-2 text-2xl font-black text-white">
                {strongestDomain?.label ?? 'Not available'}
              </dd>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Validity flags
              </dt>
              <dd className="mt-2 text-2xl font-black text-white">
                {currentProfileScore
                  ? currentProfileScore.validityFlags.length
                  : 'Not available'}
              </dd>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Signals used
              </dt>
              <dd className="mt-2 text-2xl font-black text-white">
                {typeof currentProfileSignalCount === 'number'
                  ? currentProfileSignalCount
                  : 'Not available'}
              </dd>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Leaderboard
              </dt>
              <dd className="mt-2 text-2xl font-black text-white">
                {currentProfileScore?.leaderboardEligible
                  ? 'Eligible'
                  : 'Pending'}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#07142f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Assessment availability
              </p>
              <p className="mt-3 text-2xl font-black text-white">
                {assessmentAvailabilityLabel}
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 text-emerald-200">
              <ClipboardCheck size={20} strokeWidth={2} />
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {assessmentAvailabilityDescription}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#07142f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Test history</p>
              <p className="mt-3 text-2xl font-black text-white">
                {role === 'CONSUMER'
                  ? scoredCompletedSessions.length
                  : completedSessions.length}
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-300/15 bg-blue-400/10 text-blue-200">
              <FileText size={20} strokeWidth={2} />
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {role === 'CONSUMER'
              ? 'Completed scored tests are managed in the dedicated Test History page.'
              : 'Completed candidate assignments are recorded separately from active access.'}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#07142f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Account role</p>
              <p className="mt-3 text-2xl font-black text-white">{role}</p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-400/10 text-violet-200">
              <UserRound size={20} strokeWidth={2} />
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Access level for this dashboard workspace.
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {role === 'CONSUMER' ? (
          <article className="rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
              <PlayCircle size={22} strokeWidth={2} />
            </span>

            <h2 className="mt-5 text-2xl font-black text-white">Take test</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {startAssessmentDescription}
            </p>

            <form action={startConsumerAssessmentAction} className="mt-5">
              <button
                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-500"
                disabled={!canStartConsumerAssessment}
                type="submit"
              >
                Start new assessment
              </button>
            </form>
          </article>
        ) : null}

        {role === 'CONSUMER' ? (
          <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-100">
              <FileText size={22} strokeWidth={2} />
            </span>

            <h2 className="mt-5 text-2xl font-black text-white">
              Test History
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              View completed attempts in a controlled history table. Detailed
              profiles should be opened from there.
            </p>

            <Link
              className="mt-5 inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
              href="/dashboard/history"
            >
              Open Test History
            </Link>
          </article>
        ) : null}

        {role === 'CONSUMER' ? (
          <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-100">
              <Trophy size={22} strokeWidth={2} />
            </span>

            <h2 className="mt-5 text-2xl font-black text-white">
              Your leaderboard position
            </h2>

            {leaderboardError ? (
              <p className="mt-2 text-sm font-bold leading-6 text-amber-100">
                {leaderboardError}
              </p>
            ) : (
              <>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Rank
                    </dt>
                    <dd className="mt-2 text-2xl font-black text-white">
                      {formatRank(leaderboardSummary?.rank)}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Listing
                    </dt>
                    <dd className="mt-2 text-2xl font-black text-white">
                      {leaderboardSummary?.eligibility.publicListingActive
                        ? 'Public'
                        : leaderboardSummary?.preferences.optIn
                          ? 'Pending'
                          : 'Off'}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {leaderboardSummary?.entry
                    ? `Best eligible IQ Score: ${leaderboardSummary.entry.iqScore}.`
                    : 'No eligible public ranking result is available yet.'}
                </p>

                {leaderboardSummary?.eligibility.reasons.length ? (
                  <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                    {leaderboardSummary.eligibility.reasons[0]}
                  </div>
                ) : null}

                <form
                  action={updateLeaderboardPreferencesAction}
                  className="mt-5 space-y-3"
                >
                  <div>
                    <label
                      className="text-xs font-black uppercase tracking-[0.16em] text-slate-500"
                      htmlFor="leaderboard-display-name"
                    >
                      Public display name
                    </label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
                      defaultValue={
                        leaderboardSummary?.preferences.displayName ??
                        session.user.name ??
                        ''
                      }
                      id="leaderboard-display-name"
                      maxLength={40}
                      name="displayName"
                      placeholder="Example: Cipher Nyx"
                    />
                  </div>

                  <input
                    name="optIn"
                    type="hidden"
                    value={
                      leaderboardSummary?.preferences.optIn ? 'false' : 'true'
                    }
                  />

                  <button
                    className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
                    type="submit"
                  >
                    {leaderboardSummary?.preferences.optIn
                      ? 'Turn off public listing'
                      : 'Enable public listing'}
                  </button>
                </form>
              </>
            )}
          </article>
        ) : null}

        {role === 'CONSUMER' ? (
          <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-100">
              <Trophy size={22} strokeWidth={2} />
            </span>

            <h2 className="mt-5 text-2xl font-black text-white">Leaderboard</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              View the public opt-in leaderboard. Your dashboard will later show
              only your own position and listing status.
            </p>

            <Link
              className="mt-5 inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
              href="/leaderboard"
            >
              Open leaderboard
            </Link>
          </article>
        ) : null}

        <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-400/10 text-blue-100">
            <Settings size={22} strokeWidth={2} />
          </span>

          <h2 className="mt-5 text-2xl font-black text-white">Settings</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage account security, sessions, notification preferences, and
            password settings.
          </p>

          <Link
            className="mt-5 inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
            href="/dashboard/settings"
          >
            Open settings
          </Link>
        </article>
      </section>
    </div>
  );
}
