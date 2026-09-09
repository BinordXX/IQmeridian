import Link from 'next/link';

import {
  fetchInternalUsers,
  internalUserRoleLabels,
  internalUserStatusLabels,
  type InternalUserRole,
  type InternalUserStatus,
} from '../../_lib/internal-api';

type UsersPageProps = {
  searchParams?: Promise<{
    role?: string;
    status?: string;
    search?: string;
  }>;
};

const roleOptions: InternalUserRole[] = [
  'CONSUMER',
  'CANDIDATE',
  'RESEARCHER',
  'EMPLOYER_ADMIN',
  'PLATFORM_ADMIN',
];

const statusOptions: InternalUserStatus[] = ['ACTIVE', 'SUSPENDED', 'DISABLED'];

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const getStatusClassName = (status: InternalUserStatus) => {
  if (status === 'ACTIVE') {
    return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
  }

  if (status === 'SUSPENDED') {
    return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
  }

  return 'border-red-300/20 bg-red-400/10 text-red-100';
};

export default async function InternalAdminUsersPage({
  searchParams,
}: UsersPageProps) {
  const resolvedSearchParams = await searchParams;

  const users = await fetchInternalUsers({
    role: resolvedSearchParams?.role,
    status: resolvedSearchParams?.status,
    search: resolvedSearchParams?.search,
  });

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              User management
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              Platform users
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Review consumers, candidates, researchers, employer
              administrators, and platform administrators from one controlled
              management desk.
            </p>
          </div>

          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
            href="/internal/admin/users/new"
          >
            Create user
          </Link>
        </div>
      </header>

      <form className="grid gap-3 rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
        <div>
          <label className="text-sm font-bold text-slate-300" htmlFor="search">
            Search
          </label>

          <input
            className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
            defaultValue={resolvedSearchParams?.search ?? ''}
            id="search"
            name="search"
            placeholder="Email or name"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-300" htmlFor="role">
            Role
          </label>

          <select
            className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
            defaultValue={resolvedSearchParams?.role ?? ''}
            id="role"
            name="role"
          >
            <option value="">All roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {internalUserRoleLabels[role]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-300" htmlFor="status">
            Status
          </label>

          <select
            className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
            defaultValue={resolvedSearchParams?.status ?? ''}
            id="status"
            name="status"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {internalUserStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            className="min-h-12 w-full rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
            type="submit"
          >
            Filter
          </button>
        </div>
      </form>

      <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/90 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">
            {users.length} users
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#020817]/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Organisation</th>
                <th className="px-5 py-3">Last login</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-black text-white">
                      {user.name ?? 'Unnamed user'}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {user.email}
                    </p>
                  </td>

                  <td className="px-5 py-4 font-bold text-slate-300">
                    {internalUserRoleLabels[user.role] ?? user.role}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClassName(
                        user.status
                      )}`}
                    >
                      {internalUserStatusLabels[user.status] ?? user.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-400">
                    {user.organisation?.name ?? user.organisationId ?? 'None'}
                  </td>

                  <td className="px-5 py-4 text-slate-400">
                    {formatDate(user.lastLoginAt)}
                  </td>

                  <td className="px-5 py-4 text-slate-400">
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <Link
                      className="font-black text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline"
                      href={`/internal/admin/users/${user.id}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 ? (
            <p className="border-t border-white/10 px-5 py-10 text-center text-sm text-slate-500">
              No users match the current filters.
            </p>
          ) : null}
        </div>
      </article>
    </section>
  );
}
