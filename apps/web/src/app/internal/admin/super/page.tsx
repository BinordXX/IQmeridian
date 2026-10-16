import { KeyRound, ShieldCheck, UserCheck, UserCog, Users } from 'lucide-react';

import { requireSuperAdmin } from '@/lib/route-guards';

import {
  revokeSuperAdminSessionsAction,
  updateSuperAdminStatusAction,
} from './actions';
import {
  fetchSuperAdminAccounts,
  fetchSuperAdminOverview,
  type SuperAdminAccountStatus,
} from './_lib/super-admin-api';

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Never';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatAction = (action: string) => {
  return action
    .replaceAll('_', ' ')
    .replaceAll('.', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const statusClassName = (status: SuperAdminAccountStatus) => {
  if (status === 'ACTIVE') {
    return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200';
  }

  if (status === 'SUSPENDED') {
    return 'border-amber-300/20 bg-amber-400/10 text-amber-200';
  }

  if (status === 'PENDING_EMAIL_VERIFICATION') {
    return 'border-blue-300/20 bg-blue-400/10 text-blue-200';
  }

  return 'border-rose-300/20 bg-rose-400/10 text-rose-200';
};

export default async function SuperAdminPage() {
  const { session } = await requireSuperAdmin('/internal/admin/super');

  if (!session.accessToken) {
    throw new Error('Super Admin session is missing an API access token.');
  }

  const [overview, admins] = await Promise.all([
    fetchSuperAdminOverview(session.accessToken),
    fetchSuperAdminAccounts(session.accessToken),
  ]);

  const currentUserId = session.user.id;

  const metricCards = [
    {
      label: 'Super admins',
      value: overview.totalSuperAdmins,
      detail: `${overview.activeSuperAdmins} active`,
      icon: ShieldCheck,
    },
    {
      label: 'Platform admins',
      value: overview.totalPlatformAdmins,
      detail: 'Operational administrators',
      icon: UserCog,
    },
    {
      label: 'Inactive admins',
      value: overview.inactiveAdminAccounts,
      detail: 'Suspended, disabled, or pending',
      icon: Users,
    },
    {
      label: 'Active privileged sessions',
      value: overview.activePrivilegedSessions,
      detail: 'Current administrator sessions',
      icon: KeyRound,
    },
  ];

  return (
    <section className="space-y-7">
      <header className="overflow-hidden rounded-[2rem] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(120,53,15,0.24),rgba(8,20,47,0.96)_45%,rgba(6,15,37,0.98))] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.34em] text-amber-300">
              Root platform governance
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Super Administration
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Manage privileged administrator accounts, privileged sessions,
              platform safeguards, and high-trust administrative activity.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-100">
            <ShieldCheck size={16} />
            Super Admin only
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
              key={card.label}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-black text-white">
                    {card.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {card.detail}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 p-3 text-amber-200">
                  <Icon size={20} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Privileged identities
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              Administrator accounts
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Super Admin and Platform Admin accounts only.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-300">
            {admins.length} privileged accounts
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/[0.025]">
              <tr className="text-left text-xs font-black uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Administrator</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Verified</th>
                <th className="px-6 py-4">Last login</th>
                <th className="px-6 py-4">Sessions</th>
                <th className="px-6 py-4">Controls</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {admins.map((admin) => {
                const isCurrentUser = admin.id === currentUserId;
                const nextStatus: SuperAdminAccountStatus =
                  admin.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

                const updateStatus = updateSuperAdminStatusAction.bind(
                  null,
                  admin.id,
                  nextStatus
                );

                const revokeSessions = revokeSuperAdminSessionsAction.bind(
                  null,
                  admin.id
                );

                return (
                  <tr className="align-top" key={admin.id}>
                    <td className="px-6 py-5">
                      <p className="font-black text-white">
                        {admin.name ?? 'Unnamed administrator'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {admin.email}
                      </p>
                      {isCurrentUser ? (
                        <span className="mt-2 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200">
                          Current account
                        </span>
                      ) : null}
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-200">
                        {admin.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={[
                          'inline-flex rounded-full border px-3 py-1 text-xs font-black',
                          statusClassName(admin.status),
                        ].join(' ')}
                      >
                        {admin.status.replaceAll('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-300">
                        <UserCheck
                          className={
                            admin.emailVerified
                              ? 'text-emerald-300'
                              : 'text-slate-600'
                          }
                          size={16}
                        />
                        {admin.emailVerified ? 'Verified' : 'Not verified'}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-slate-400">
                      {formatDate(admin.lastLoginAt)}
                    </td>

                    <td className="px-6 py-5">
                      <span className="font-black text-white">
                        {admin.activeSessionCount}
                      </span>
                      <span className="ml-1 text-slate-500">active</span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex min-w-48 flex-col gap-2">
                        <form action={updateStatus}>
                          <button
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-slate-200 transition hover:border-amber-300/20 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={isCurrentUser}
                            type="submit"
                          >
                            {admin.status === 'ACTIVE'
                              ? 'Deactivate account'
                              : 'Activate account'}
                          </button>
                        </form>

                        <form action={revokeSessions}>
                          <button
                            className="w-full rounded-xl border border-rose-300/15 bg-rose-400/[0.07] px-3 py-2 text-xs font-black text-rose-200 transition hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={
                              isCurrentUser || admin.activeSessionCount === 0
                            }
                            type="submit"
                          >
                            Revoke all sessions
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {admins.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-10 text-center text-slate-500"
                    colSpan={7}
                  >
                    No privileged administrator accounts were found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-fuchsia-300">
            Security record
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            Recent privileged activity
          </h2>
        </div>

        <div className="divide-y divide-white/10">
          {overview.recentPrivilegedAudit.map((event) => (
            <div
              className="flex flex-col gap-3 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              key={event.id}
            >
              <div>
                <p className="font-black text-white">
                  {formatAction(event.action)}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {event.user?.name ??
                    event.user?.email ??
                    'System / unavailable actor'}
                </p>
              </div>

              <div className="text-left lg:text-right">
                <p className="text-xs font-bold text-slate-500">
                  {event.entityType ?? 'Platform event'}
                  {event.entityId ? ` · ${event.entityId}` : ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(event.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {overview.recentPrivilegedAudit.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              No privileged audit activity is available yet.
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
