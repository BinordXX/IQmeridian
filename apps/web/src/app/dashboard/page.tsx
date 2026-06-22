import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getDefaultDashboardForRole, isAppRole } from '@/lib/role-routing';

import { startConsumerAssessmentAction } from './actions';
import {
  getConsumerAssessmentDefault,
  listConsumerSessions,
  type ConsumerAssessmentDefault,
  type ConsumerSessionSummary,
} from './consumer-dashboard-api';

import { SignOutButton } from './signout-button';

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
    const [assessmentDefault, sessionRecords] = await Promise.all([
      getConsumerAssessmentDefault(),
      listConsumerSessions(),
    ]);

    consumerAssessment = assessmentDefault;
    sessions = sessionRecords;
  } catch (error) {
    dashboardError =
      error instanceof Error
        ? error.message
        : 'Unable to load consumer dashboard data.';
  }

  const hasSessions = sessions.length > 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              IQMeridian consumer dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Welcome, {session.user.name ?? session.user.email}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              This is your personal assessment space. From here, you can start
              assessments, resume active sessions, review completed test
              history, and manage your account profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950"
              href="/"
            >
              Home
            </Link>
            <SignOutButton />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          {resolvedSearchParams?.startError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {resolvedSearchParams.startError}
            </div>
          ) : null}

          {dashboardError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {dashboardError}
            </div>
          ) : null}

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Assessment
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Start your IQMeridian assessment
                </h2>
                {consumerAssessment ? (
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
                )}
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Available
              </span>
            </div>

            <form action={startConsumerAssessmentAction} className="mt-6">
              <button
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                disabled={!consumerAssessment}
                type="submit"
              >
                Start new assessment
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Test history
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Your assessment records
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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
            <p className="text-sm font-semibold text-slate-500">Profile</p>
            <h2 className="mt-2 text-xl font-bold">Account details</h2>

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
            <p className="text-sm font-semibold text-slate-500">Tools</p>
            <h2 className="mt-2 text-xl font-bold">Consumer workspace</h2>

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
    </main>
  );
}
