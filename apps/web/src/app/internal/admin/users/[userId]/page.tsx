import Link from 'next/link';

import {
  fetchInternalOrganisations,
  fetchInternalUserById,
  internalUserRoleLabels,
  internalUserStatusLabels,
  type InternalUserRole,
  type InternalUserStatus,
} from '../../../_lib/internal-api';
import {
  updateUserOrganisationAction,
  updateUserRoleAction,
  updateUserStatusAction,
} from './actions';

type UserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams?: Promise<{
    updated?: string;
    error?: string;
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

export default async function InternalAdminUserDetailPage({
  params,
  searchParams,
}: UserDetailPageProps) {
  const { userId } = await params;
  const resolvedSearchParams = await searchParams;

  const [user, organisations] = await Promise.all([
    fetchInternalUserById(userId),
    fetchInternalOrganisations(),
  ]);

  const updateRole = updateUserRoleAction.bind(null, user.id);
  const updateStatus = updateUserStatusAction.bind(null, user.id);
  const updateOrganisation = updateUserOrganisationAction.bind(null, user.id);

  return (
    <section className="space-y-6">
      <div>
        <Link
          className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
          href="/internal/admin/users"
        >
          ← Back to users
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
          User profile
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {user.name ?? user.email}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{user.email}</p>
      </div>

      {resolvedSearchParams?.updated ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          User updated successfully.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          User update failed.
        </div>
      ) : null}

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Account details</h2>

        <dl className="mt-5 grid gap-5 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">User ID</dt>
            <dd className="mt-1 break-all font-mono text-xs">{user.id}</dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">Email</dt>
            <dd className="mt-1 font-semibold">{user.email}</dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">Name</dt>
            <dd className="mt-1 font-semibold">{user.name ?? 'Not set'}</dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">Role</dt>
            <dd className="mt-1 font-semibold">
              {internalUserRoleLabels[user.role] ?? user.role}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">Status</dt>
            <dd className="mt-1 font-semibold">
              {internalUserStatusLabels[user.status] ?? user.status}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">Organisation</dt>
            <dd className="mt-1 font-semibold">
              {user.organisation?.name ?? user.organisationId ?? 'None'}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">Last login</dt>
            <dd className="mt-1 font-semibold">
              {formatDate(user.lastLoginAt)}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">Created</dt>
            <dd className="mt-1 font-semibold">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </article>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Change role</h2>
          <form action={updateRole} className="mt-5 space-y-4">
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              defaultValue={user.role}
              name="role"
              required
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {internalUserRoleLabels[role]}
                </option>
              ))}
            </select>

            <button
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              type="submit"
            >
              Save role
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Change status</h2>
          <form action={updateStatus} className="mt-5 space-y-4">
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              defaultValue={user.status}
              name="status"
              required
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {internalUserStatusLabels[status]}
                </option>
              ))}
            </select>

            <button
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              type="submit"
            >
              Save status
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Assign organisation</h2>
          <form action={updateOrganisation} className="mt-5 space-y-4">
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              defaultValue={user.organisationId ?? ''}
              name="organisationId"
            >
              <option value="">No organisation</option>
              {organisations.map((organisation) => (
                <option key={organisation.id} value={organisation.id}>
                  {organisation.name}
                </option>
              ))}
            </select>

            <button
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              type="submit"
            >
              Save organisation
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}
