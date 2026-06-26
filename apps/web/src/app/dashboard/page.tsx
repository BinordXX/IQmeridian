import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  PlayCircle,
  UserRound,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getDefaultDashboardForRole, isAppRole } from '@/lib/role-routing';

import { startConsumerAssessmentAction } from './actions';
import {
  getConsumerAssessmentDefault,
  listConsumerSessionsWithPsychometricScores,
  type ConsumerAssessmentDefault,
  type ConsumerSessionSummary,
} from './consumer-dashboard-api';

type DashboardPageProps = {
  searchParams?: Promise<{
    startError?: string;
  }>;
};

const profileTools = [
  {
    title: 'Profile',
    description: 'Review your account identity and dashboard access role.',
  },
  {
    title: 'Assessment readiness',
    description:
      'Check instructions, timing expectations, and assessment preparation notes before starting a test.',
  },
  {
    title: 'Reports',
    description:
      'View completed assessment results once reports are available for your account.',
  },
  {
    title: 'Privacy and data',
    description:
      'Understand how your responses, scores, and reports are handled on IQMeridian.',
  },
];

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
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

const getSessionHref = (session: ConsumerSessionSummary) => {
  if (session.status === 'IN_PROGRESS') {
    return `/assessment/session/${session.id}`;
  }

  return `/assessment/session/${session.id}/instructions`;
};

const getSessionActionLabel = (session: ConsumerSessionSummary) => {
  if (session.status === 'COMPLETED' || session.status === 'FINALISED') {
    return 'Review';
  }

  if (session.status === 'IN_PROGRESS') {
    return 'Resume';
  }

  return 'Open';
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
  let dashboardError: string | null = null;

  try {
    if (role === 'CONSUMER') {
      const [assessmentDefault, sessionRecords] = await Promise.all([
        getConsumerAssessmentDefault(),
        listConsumerSessionsWithPsychometricScores(),
      ]);

      consumerAssessment = assessmentDefault;
      sessions = sessionRecords;
    } else {
      sessions = await listConsumerSessionsWithPsychometricScores();
    }
  } catch (error) {
    dashboardError =
      error instanceof Error ? error.message : 'Unable to load dashboard data.';
  }

  const hasSessions = sessions.length > 0;
  const canStartConsumerAssessment =
    role === 'CONSUMER' && Boolean(consumerAssessment);

  const assessmentAvailabilityLabel =
    role === 'CONSUMER'
      ? consumerAssessment
        ? 'Available'
        : 'Unavailable'
      : 'Assigned only';

  const assessmentAvailabilityDescription =
    role === 'CONSUMER'
      ? consumerAssessment
        ? consumerAssessment.assessmentForm.name
        : 'No default consumer assessment has been selected yet.'
      : 'Candidate assessments are assigned through invitations or employer campaigns.';

  const startAssessmentDescription =
    role === 'CONSUMER' ? (
      consumerAssessment ? (
        <>
          Create a new consumer-owned assessment session for{' '}
          <span className="font-semibold text-slate-950">
            {consumerAssessment.assessmentForm.name ??
              'the active consumer assessment'}
          </span>
          . Your session will be saved to your account history.
        </>
      ) : (
        'No consumer assessment is currently available. A platform administrator must select an active default assessment first.'
      )
    ) : (
      'Candidate assessments are assigned through invitations or employer campaigns. When an assessment is assigned to you, it will appear in your assessment history.'
    );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              IQMeridian consumer dashboard
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Welcome, {session.user.name ?? session.user.email}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              This is your personal assessment space. From here, you can start
              assessments, resume active sessions, review completed test
              history, and manage your account profile.
            </p>
          </div>

          <Link
            className="w-fit rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950"
            href="/"
          >
            Home
          </Link>
        </div>
      </section>

      {resolvedSearchParams?.startError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <span>{resolvedSearchParams.startError}</span>
        </div>
      ) : null}

      {dashboardError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <span>{dashboardError}</span>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Assessment availability
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {assessmentAvailabilityLabel}
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <ClipboardCheck size={20} strokeWidth={2} />
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            {assessmentAvailabilityDescription}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Assessment records
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {sessions.length}
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
              <FileText size={20} strokeWidth={2} />
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Saved sessions in your personal account history.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Account role</p>
              <p className="mt-3 text-2xl font-bold text-slate-950">{role}</p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700">
              <UserRound size={20} strokeWidth={2} />
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Access level for this dashboard workspace.
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <PlayCircle size={22} strokeWidth={2} />
                </span>

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Assessment
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    Start your IQMeridian assessment
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {startAssessmentDescription}
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {assessmentAvailabilityLabel}
              </span>
            </div>

            <form action={startConsumerAssessmentAction} className="mt-6">
              <button
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                disabled={!canStartConsumerAssessment}
                type="submit"
              >
                Start new assessment
              </button>
            </form>
          </article>

          <article
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            id="history"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                  <FileText size={22} strokeWidth={2} />
                </span>

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Test history
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    Your assessment records
                  </h2>
                </div>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {sessions.length} session{sessions.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {hasSessions ? (
                sessions.map((assessmentSession) => (
                  <div
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    key={assessmentSession.id}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {getSessionTitle(assessmentSession)}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Created: {formatDate(assessmentSession.createdAt)}
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          Started: {formatDate(assessmentSession.startedAt)}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {assessmentSession.status}
                        </span>
                        <Link
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950"
                          href={getSessionHref(assessmentSession)}
                        >
                          {getSessionActionLabel(assessmentSession)}
                        </Link>
                      </div>
                    </div>

                    {isCompletedSession(assessmentSession) ? (
                      assessmentSession.psychometricScore ? (
                        <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                Psychometric profile
                              </p>
                              <h4 className="mt-1 text-lg font-bold text-slate-950">
                                {formatScoreBand(
                                  assessmentSession.psychometricScore
                                    .overallScoreBand
                                )}
                              </h4>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {
                                  assessmentSession.psychometricScore
                                    .overallInterpretation
                                }
                              </p>
                            </div>

                            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {
                                assessmentSession.psychometricScore
                                  .scoringStatus
                              }
                            </span>
                          </div>

                          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg bg-slate-50 p-3">
                              <dt className="text-xs font-medium text-slate-500">
                                Standard score
                              </dt>
                              <dd className="mt-1 text-lg font-bold text-slate-950">
                                {formatWholeNumber(
                                  assessmentSession.psychometricScore
                                    .overallStandardScore
                                )}
                              </dd>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3">
                              <dt className="text-xs font-medium text-slate-500">
                                Percentile
                              </dt>
                              <dd className="mt-1 text-lg font-bold text-slate-950">
                                {formatPercentile(
                                  assessmentSession.psychometricScore
                                    .overallPercentile
                                )}
                              </dd>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3">
                              <dt className="text-xs font-medium text-slate-500">
                                Accuracy
                              </dt>
                              <dd className="mt-1 text-lg font-bold text-slate-950">
                                {formatAccuracy(
                                  assessmentSession.psychometricScore
                                    .overallAccuracy
                                )}
                              </dd>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3">
                              <dt className="text-xs font-medium text-slate-500">
                                90% interval
                              </dt>
                              <dd className="mt-1 text-lg font-bold text-slate-950">
                                {assessmentSession.psychometricScore
                                  .overallCi90Lower !== null &&
                                assessmentSession.psychometricScore
                                  .overallCi90Upper !== null
                                  ? `${formatWholeNumber(
                                      assessmentSession.psychometricScore
                                        .overallCi90Lower
                                    )}–${formatWholeNumber(
                                      assessmentSession.psychometricScore
                                        .overallCi90Upper
                                    )}`
                                  : 'Not available'}
                              </dd>
                            </div>
                          </dl>

                          {assessmentSession.psychometricScore.domainScores
                            .length > 0 ? (
                            <div className="mt-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Domain profile
                              </p>

                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                {assessmentSession.psychometricScore.domainScores.map(
                                  (domainScore) => (
                                    <div
                                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                      key={domainScore.id}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-semibold text-slate-950">
                                            {domainScore.label}
                                          </p>
                                          <p className="mt-1 text-xs text-slate-500">
                                            {formatAccuracy(
                                              domainScore.accuracy
                                            )}{' '}
                                            accuracy
                                          </p>
                                        </div>

                                        <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                                          {formatScoreBand(
                                            domainScore.scoreBand
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ) : null}

                          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                            <p>
                              Model:{' '}
                              <span className="font-semibold text-slate-800">
                                {
                                  assessmentSession.psychometricScore
                                    .modelVersion
                                }
                              </span>
                            </p>
                            <p>
                              Scoring mode:{' '}
                              <span className="font-semibold text-slate-800">
                                {
                                  assessmentSession.psychometricScore
                                    .scoringModeUsed
                                }
                              </span>
                            </p>
                            <p className="mt-1">
                              Scores are provisional until IQMeridian completes
                              formal calibration and norming.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50 p-4">
                          <p className="text-sm font-semibold text-amber-900">
                            Score profile pending
                          </p>
                          <p className="mt-1 text-sm leading-6 text-amber-800">
                            This assessment is complete, but the psychometric
                            score profile has not been generated or persisted
                            yet.
                          </p>
                        </div>
                      )
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <h3 className="font-semibold">No assessments yet</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Your assessment history will appear here after you create or
                    complete your first session.
                  </p>
                </div>
              )}
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700">
                <UserRound size={22} strokeWidth={2} />
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-500">Profile</p>
                <h2 className="mt-2 text-xl font-bold">Account details</h2>
              </div>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Name</dt>
                <dd className="mt-1 font-semibold">
                  {session.user.name ?? 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Email</dt>
                <dd className="mt-1 font-semibold">{session.user.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Role</dt>
                <dd className="mt-1 font-semibold">{role}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
                <Wrench size={22} strokeWidth={2} />
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-500">Tools</p>
                <h2 className="mt-2 text-xl font-bold">Consumer workspace</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {profileTools.map((tool) => (
                <div
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  key={tool.title}
                >
                  <h3 className="text-sm font-semibold">{tool.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
