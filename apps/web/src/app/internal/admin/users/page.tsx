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
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            User management
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Platform users
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review consumers, candidates, researchers, employer administrators,
            and platform administrators from one controlled management desk.
          </p>
        </div>

        <Link
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          href="/internal/admin/users/new"
        >
          Create user
        </Link>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
        <div>
          <label
            className="text-sm font-medium text-slate-600"
            htmlFor="search"
          >
            Search
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            defaultValue={resolvedSearchParams?.search ?? ''}
            id="search"
            name="search"
            placeholder="Email or name"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="role">
            Role
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
          <label
            className="text-sm font-medium text-slate-600"
            htmlFor="status"
          >
            Status
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
            className="w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            type="submit"
          >
            Filter
          </button>
        </div>
      </form>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold">{users.length} users</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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

            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-950">
                      {user.name ?? 'Unnamed user'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    {internalUserRoleLabels[user.role] ?? user.role}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {internalUserStatusLabels[user.status] ?? user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {user.organisation?.name ?? user.organisationId ?? 'None'}
                  </td>
                  <td className="px-5 py-4">{formatDate(user.lastLoginAt)}</td>
                  <td className="px-5 py-4">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <Link
                      className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                      href={`/internal/admin/users/${user.id}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
