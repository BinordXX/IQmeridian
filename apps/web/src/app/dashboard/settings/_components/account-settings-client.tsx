'use client';

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ChangePasswordForm } from './change-password-form';
import { useRouter } from 'next/navigation';

type AppRole =
  | 'PLATFORM_ADMIN'
  | 'RESEARCHER'
  | 'EMPLOYER_ADMIN'
  | 'CANDIDATE'
  | 'CONSUMER';

type AccountUser = {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  status: string;
  organisationId: string | null;
  organisation?: {
    id: string;
    name: string;
  } | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletionRequestedAt: string | null;
  deletedAt: string | null;
};

type NotificationPreferences = {
  id: string;
  userId: string;
  securityAlerts: boolean;
  assessmentReminders: boolean;
  productUpdates: boolean;
  researchGovernanceUpdates: boolean;
  createdAt: string;
  updatedAt: string;
};

type AccountProfileResponse = {
  user: AccountUser;
  notificationPreferences: NotificationPreferences;
  accountStats: {
    activeSessionCount: number;
    assessmentSessionCount: number;
  };
};

type AccountSession = {
  id: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
  isCurrent: boolean;
};

type AccountSessionsResponse = {
  items: AccountSession[];
};

type InitialUser = {
  name?: string | null;
  email?: string | null;
  role?: AppRole;
};

type AccountSettingsClientProps = {
  initialUser: InitialUser;
  sessionExpires?: string | null;
};

type RequestStatus = {
  tone: 'success' | 'error' | 'info';
  message: string;
} | null;

const preferenceLabels: Array<{
  key: keyof Pick<
    NotificationPreferences,
    | 'securityAlerts'
    | 'assessmentReminders'
    | 'productUpdates'
    | 'researchGovernanceUpdates'
  >;
  title: string;
  description: string;
}> = [
  {
    key: 'securityAlerts',
    title: 'Security alerts',
    description:
      'Important account security events such as password changes and session revocations.',
  },
  {
    key: 'assessmentReminders',
    title: 'Assessment reminders',
    description:
      'Reminders and status updates related to active IQMeridian assessments.',
  },
  {
    key: 'productUpdates',
    title: 'Product updates',
    description:
      'Occasional updates about IQMeridian platform improvements and releases.',
  },
  {
    key: 'researchGovernanceUpdates',
    title: 'Research governance updates',
    description:
      'Updates about research workflows, governance changes, and psychometric review notices.',
  },
];

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  const payload = responseText.trim()
    ? (JSON.parse(responseText) as unknown)
    : {};

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof (payload as { message?: unknown }).message === 'string'
        ? (payload as { message: string }).message
        : 'Request failed.';

    throw new Error(message);
  }

  return payload as T;
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    cache: 'no-store',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  return parseJsonResponse<T>(response);
}

function formatDate(value?: string | Date | null) {
  if (!value) {
    return 'Not available';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || 'IQMeridian';
  const parts = source
    .replace(/@.*$/, '')
    .split(/[.\s_-]+/)
    .filter(Boolean);

  const first = parts[0]?.[0] ?? 'I';
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? 'Q';

  return `${first}${second}`.toUpperCase();
}

function getSessionStatusClassName(session: AccountSession) {
  if (session.isCurrent) {
    return 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100';
  }

  if (session.status === 'ACTIVE') {
    return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100';
  }

  if (session.status === 'REVOKED') {
    return 'border-amber-300/25 bg-amber-400/10 text-amber-100';
  }

  return 'border-white/10 bg-[#020817]/70 text-slate-300';
}

function getStatusClassName(status: RequestStatus) {
  if (!status) {
    return 'hidden';
  }

  if (status.tone === 'success') {
    return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
  }

  if (status.tone === 'error') {
    return 'border-red-300/20 bg-red-400/10 text-red-100';
  }

  return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
}

export function AccountSettingsClient({
  initialUser,
  sessionExpires,
}: AccountSettingsClientProps) {
  const router = useRouter();
  const { update } = useSession();
  const [profile, setProfile] = useState<AccountProfileResponse | null>(null);
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false);
  const [profileName, setProfileName] = useState(initialUser.name ?? '');
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [profileStatus, setProfileStatus] = useState<RequestStatus>(null);
  const [preferenceStatus, setPreferenceStatus] = useState<RequestStatus>(null);
  const [sessionStatus, setSessionStatus] = useState<RequestStatus>(null);
  const [deleteStatus, setDeleteStatus] = useState<RequestStatus>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const accountUser = profile?.user;
  const displayName =
    accountUser?.name || initialUser.name || initialUser.email || 'User';
  const displayEmail =
    accountUser?.email || initialUser.email || 'Not available';
  const displayRole = accountUser?.role || initialUser.role || 'CONSUMER';
  const initials = useMemo(
    () => getInitials(displayName, displayEmail),
    [displayEmail, displayName]
  );

  const activeSessionCount = sessions.filter(
    (session) => session.status === 'ACTIVE'
  ).length;

  const isPlatformAdmin = displayRole === 'PLATFORM_ADMIN';

  async function loadAccount() {
    setIsLoading(true);
    setProfileStatus(null);

    try {
      const [nextProfile, nextSessions] = await Promise.all([
        fetchJson<AccountProfileResponse>('/api/account/profile'),
        fetchJson<AccountSessionsResponse>('/api/account/sessions'),
      ]);

      setProfile(nextProfile);
      setProfileName(nextProfile.user.name ?? '');
      setPreferences(nextProfile.notificationPreferences);
      setSessions(nextSessions.items);
    } catch (error) {
      setProfileStatus({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load account settings.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshSessions() {
    setIsRefreshingSessions(true);
    setSessionStatus(null);

    try {
      const nextSessions = await fetchJson<AccountSessionsResponse>(
        '/api/account/sessions'
      );

      setSessions(nextSessions.items);
    } catch (error) {
      setSessionStatus({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to refresh sessions.',
      });
    } finally {
      setIsRefreshingSessions(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAccount();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileStatus(null);

    try {
      const response = await fetchJson<{
        user: AccountUser;
        message: string;
      }>('/api/account/profile', {
        body: JSON.stringify({
          name: profileName,
        }),
        method: 'PATCH',
      });

      setProfile((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              user: response.user,
            }
          : currentProfile
      );

      await update({
        user: {
          name: response.user.name,
        },
      });

      router.refresh();

      setProfileStatus({
        tone: 'success',
        message: response.message,
      });
    } catch (error) {
      setProfileStatus({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Unable to update profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  function updatePreference(
    key: keyof Pick<
      NotificationPreferences,
      | 'securityAlerts'
      | 'assessmentReminders'
      | 'productUpdates'
      | 'researchGovernanceUpdates'
    >,
    value: boolean
  ) {
    setPreferences((currentPreferences) =>
      currentPreferences
        ? {
            ...currentPreferences,
            [key]: value,
          }
        : currentPreferences
    );
  }

  async function handlePreferencesSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!preferences) {
      return;
    }

    setIsSavingPreferences(true);
    setPreferenceStatus(null);

    try {
      const response = await fetchJson<{
        preferences: NotificationPreferences;
        message: string;
      }>('/api/account/notification-preferences', {
        body: JSON.stringify({
          assessmentReminders: preferences.assessmentReminders,
          productUpdates: preferences.productUpdates,
          researchGovernanceUpdates: preferences.researchGovernanceUpdates,
          securityAlerts: preferences.securityAlerts,
        }),
        method: 'PATCH',
      });

      setPreferences(response.preferences);
      setPreferenceStatus({
        tone: 'success',
        message: response.message,
      });
    } catch (error) {
      setPreferenceStatus({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update notification preferences.',
      });
    } finally {
      setIsSavingPreferences(false);
    }
  }

  async function revokeSession(sessionId: string) {
    setSessionStatus(null);

    try {
      const response = await fetchJson<{ message: string }>(
        `/api/account/sessions/${encodeURIComponent(sessionId)}/revoke`,
        {
          method: 'PATCH',
        }
      );

      setSessionStatus({
        tone: 'success',
        message: response.message,
      });

      await refreshSessions();
    } catch (error) {
      setSessionStatus({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Unable to revoke session.',
      });
    }
  }

  async function revokeOtherSessions() {
    setIsRevokingOthers(true);
    setSessionStatus(null);

    try {
      const response = await fetchJson<{
        message: string;
        revokedCount: number;
      }>('/api/account/sessions/revoke-others', {
        method: 'POST',
      });

      setSessionStatus({
        tone: 'success',
        message: `${response.message} Revoked: ${response.revokedCount}.`,
      });

      await refreshSessions();
    } catch (error) {
      setSessionStatus({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to revoke other sessions.',
      });
    } finally {
      setIsRevokingOthers(false);
    }
  }

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDeleting(true);
    setDeleteStatus(null);

    try {
      const response = await fetchJson<{ message: string }>(
        '/api/account/delete',
        {
          body: JSON.stringify({
            confirmation: deleteConfirmation,
            password: deletePassword,
          }),
          method: 'POST',
        }
      );

      setDeleteStatus({
        tone: 'success',
        message: response.message,
      });

      await signOut({
        callbackUrl: '/',
      });
    } catch (error) {
      setDeleteStatus({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Unable to delete account.',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-[#07142f]/80 p-8 text-white shadow-[0_30px_90px_rgba(0,0,0,0.26)]">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="animate-spin text-cyan-300" size={20} />
          <span className="text-sm font-bold">Loading account settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.13),transparent_24%)]"
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              Account settings
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Profile, sessions, notifications, and account control.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Manage your IQMeridian identity, security state, notification
              preferences, active sessions, and account lifecycle.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.045] p-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-sm font-black text-cyan-100">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-slate-500">{displayEmail}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-wide text-cyan-300">
                {displayRole.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div
        className={[
          'rounded-2xl border px-4 py-3 text-sm font-bold',
          getStatusClassName(profileStatus),
        ].join(' ')}
      >
        {profileStatus?.message}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
              <UserRound size={20} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-black text-white">Profile</h2>
              <p className="text-sm text-slate-500">
                Update your public account name.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Display name
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
                minLength={2}
                maxLength={80}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder="Your name"
                value={profileName}
              />
            </label>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Email
                </p>
                <p className="mt-1 break-all font-bold text-slate-200">
                  {displayEmail}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Account status
                </p>
                <p className="mt-1 font-bold text-emerald-200">
                  {accountUser?.status ?? 'ACTIVE'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Created
                </p>
                <p className="mt-1 font-bold text-slate-200">
                  {formatDate(accountUser?.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Last login
                </p>
                <p className="mt-1 font-bold text-slate-200">
                  {formatDate(accountUser?.lastLoginAt)}
                </p>
              </div>
            </div>

            <button
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSavingProfile}
              type="submit"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                'Save profile'
              )}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-400/10 text-amber-200">
              <KeyRound size={20} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-black text-white">Change password</h2>
              <p className="text-sm text-slate-500">
                Updating your password revokes other active sessions.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-400/10 text-violet-200">
              <Bell size={20} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-black text-white">
                Notification preferences
              </h2>
              <p className="text-sm text-slate-500">
                Choose what IQMeridian may send to your account email.
              </p>
            </div>
          </div>

          <div
            className={[
              'rounded-2xl border px-4 py-3 text-xs font-bold',
              getStatusClassName(preferenceStatus),
            ].join(' ')}
          >
            {preferenceStatus?.message}
          </div>
        </div>

        <form className="mt-6 space-y-3" onSubmit={handlePreferencesSubmit}>
          {preferences ? (
            preferenceLabels.map((preference) => (
              <label
                className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-300/20 hover:bg-cyan-400/[0.045]"
                key={preference.key}
              >
                <span>
                  <span className="block text-sm font-black text-white">
                    {preference.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    {preference.description}
                  </span>
                </span>

                <input
                  checked={preferences[preference.key]}
                  className="mt-1 h-5 w-5 accent-cyan-300"
                  onChange={(event) =>
                    updatePreference(preference.key, event.target.checked)
                  }
                  type="checkbox"
                />
              </label>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              Notification preferences are not available.
            </p>
          )}

          <button
            className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSavingPreferences || !preferences}
            type="submit"
          >
            {isSavingPreferences ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                Saving...
              </>
            ) : (
              'Save preferences'
            )}
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 text-emerald-200">
              <Laptop size={20} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-black text-white">
                Sessions and security activity
              </h2>
              <p className="text-sm text-slate-500">
                Review recent sign-ins and revoke sessions you no longer trust.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-200 transition hover:border-cyan-300/20 hover:text-cyan-100 disabled:opacity-60"
              disabled={isRefreshingSessions}
              onClick={() => void refreshSessions()}
              type="button"
            >
              <RefreshCw
                className={isRefreshingSessions ? 'mr-2 animate-spin' : 'mr-2'}
                size={14}
              />
              Refresh
            </button>

            <button
              className="inline-flex items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-400/15 disabled:opacity-60"
              disabled={isRevokingOthers}
              onClick={() => void revokeOtherSessions()}
              type="button"
            >
              <LogOut className="mr-2" size={14} />
              Revoke others
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Active sessions
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {activeSessionCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Assessment sessions
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {profile?.accountStats.assessmentSessionCount ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Web session expires
            </p>
            <p className="mt-2 text-sm font-bold text-slate-300">
              {formatDate(sessionExpires)}
            </p>
          </div>
        </div>

        <div
          className={[
            'mt-4 rounded-2xl border px-4 py-3 text-sm font-bold',
            getStatusClassName(sessionStatus),
          ].join(' ')}
        >
          {sessionStatus?.message}
        </div>

        <div className="mt-6 space-y-3">
          {sessions.length ? (
            sessions.map((session) => (
              <article
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                key={session.id}
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          'rounded-full border px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em]',
                          getSessionStatusClassName(session),
                        ].join(' ')}
                      >
                        {session.isCurrent ? 'Current' : session.status}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-300">
                        {session.ipAddress ?? 'Unknown IP'}
                      </span>
                    </div>

                    <p className="mt-3 break-words text-sm font-bold text-white">
                      {session.userAgent ?? 'Unknown device'}
                    </p>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={14} />
                        Created: {formatDate(session.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={14} />
                        Last used: {formatDate(session.lastUsedAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={14} />
                        Expires: {formatDate(session.expiresAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <ShieldCheck size={14} />
                        Reason: {session.revokedReason ?? 'None'}
                      </span>
                    </div>
                  </div>

                  <button
                    className="inline-flex items-center justify-center rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-2 text-xs font-black text-red-100 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={session.isCurrent || session.status !== 'ACTIVE'}
                    onClick={() => void revokeSession(session.id)}
                    type="button"
                  >
                    Revoke
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm text-slate-500">
              No sessions found.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-red-300/20 bg-red-950/20 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-300/20 bg-red-400/10 text-red-100">
            <Trash2 size={20} strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-lg font-black text-white">Danger zone</h2>
            <p className="text-sm text-red-100/70">
              Disable your account and revoke all active sessions.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-red-300/15 bg-red-400/10 p-4 text-sm leading-6 text-red-50/80">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-200" size={18} />
            <p>
              Account deletion is implemented as a protected soft deletion. It
              disables sign-in and revokes sessions while preserving assessment,
              audit, and governance history.
            </p>
          </div>
        </div>

        <div
          className={[
            'mt-4 rounded-2xl border px-4 py-3 text-sm font-bold',
            getStatusClassName(deleteStatus),
          ].join(' ')}
        >
          {deleteStatus?.message}
        </div>

        {isPlatformAdmin ? (
          <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">
            Platform administrators cannot delete their own account from this
            screen. Use a controlled admin handover workflow instead.
          </div>
        ) : (
          <form
            className="mt-5 grid gap-4 lg:grid-cols-3"
            onSubmit={handleDeleteAccount}
          >
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-red-100/70">
                Current password
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-red-300/15 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-red-300/40"
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="Enter password"
                type="password"
                value={deletePassword}
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-red-100/70">
                Type DELETE MY ACCOUNT
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-red-300/15 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-red-300/40"
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="DELETE MY ACCOUNT"
                value={deleteConfirmation}
              />
            </label>

            <div className="flex items-end">
              <button
                className="inline-flex w-full items-center justify-center rounded-2xl border border-red-300/25 bg-red-400/15 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  isDeleting ||
                  !deletePassword ||
                  deleteConfirmation !== 'DELETE MY ACCOUNT'
                }
                type="submit"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Disabling...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2" size={16} />
                    Disable account
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
