import Link from 'next/link';

import {
  fetchInternalOrganisationById,
  fetchInternalUsers,
  internalUserRoleLabels,
  internalUserStatusLabels,
} from '../../../_lib/internal-api';
import { attachEmployerAdminAction, updateOrganisationAction } from './actions';

type OrganisationDetailPageProps = {
  params: Promise<{
    organisationId: string;
  }>;
  searchParams?: Promise<{
    updated?: string;
    error?: string;
  }>;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default async function OrganisationDetailPage({
  params,
  searchParams,
}: OrganisationDetailPageProps) {
  const { organisationId } = await params;
  const resolvedSearchParams = await searchParams;

  const [organisation, users] = await Promise.all([
    fetchInternalOrganisationById(organisationId),
    fetchInternalUsers({ limit: 100 }),
  ]);

  const organisationUsers = organisation.users ?? [];
  const campaigns = organisation.campaigns ?? [];
  const employerAdmins = organisationUsers.filter(
    (user) => user.role === 'EMPLOYER_ADMIN'
  );
  const attachableUsers = users.filter((user) => {
    if (user.status !== 'ACTIVE') return false;
    if (user.role === 'PLATFORM_ADMIN') return false;
    if (user.role === 'RESEARCHER') return false;
    if (user.role === 'CANDIDATE') return false;

    return true;
  });

  const updateOrganisation = updateOrganisationAction.bind(
    null,
    organisation.id
  );
  const attachEmployerAdmin = attachEmployerAdminAction.bind(
    null,
    organisation.id
  );

  return (
    <section className="space-y-6">
      <div>
        <Link
          className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
          href="/internal/admin/organisations"
        >
          ← Back to organisations
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Organisation profile
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {organisation.name}
        </h1>
        <p className="mt-2 break-all font-mono text-xs text-slate-500">
          {organisation.id}
        </p>
      </div>

      {resolvedSearchParams?.updated ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          Organisation updated successfully.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Users</p>
          <p className="mt-2 text-3xl font-bold">{organisationUsers.length}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Employer admins</p>
          <p className="mt-2 text-3xl font-bold">{employerAdmins.length}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Campaigns</p>
          <p className="mt-2 text-3xl font-bold">{campaigns.length}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Created</p>
          <p className="mt-2 text-sm font-semibold">
            {formatDate(organisation.createdAt)}
          </p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Rename organisation</h2>

          <form action={updateOrganisation} className="mt-5 space-y-4">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              defaultValue={organisation.name}
              name="name"
              required
              type="text"
            />

            <button
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              type="submit"
            >
              Save name
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Attach employer admin</h2>
          <p className="mt-2 text-sm text-slate-600">
            Select an active consumer or existing employer admin. Platform
            admins, researchers, and candidates are intentionally excluded.
          </p>

          <form action={attachEmployerAdmin} className="mt-5 space-y-4">
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              name="userId"
              required
            >
              <option value="">Select user</option>
              {attachableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email} — {internalUserRoleLabels[user.role]}
                </option>
              ))}
            </select>

            <button
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              type="submit"
            >
              Attach as employer admin
            </button>
          </form>
        </article>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold">Users in organisation</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last login</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {organisationUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{user.name ?? user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    {internalUserRoleLabels[user.role] ?? user.role}
                  </td>
                  <td className="px-5 py-4">
                    {internalUserStatusLabels[user.status] ?? user.status}
                  </td>
                  <td className="px-5 py-4">{formatDate(user.lastLoginAt)}</td>
                  <td className="px-5 py-4">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <Link
                      className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                      href={`/internal/admin/users/${user.id}`}
                    >
                      Open user
                    </Link>
                  </td>
                </tr>
              ))}

              {organisationUsers.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>
                    No users are attached to this organisation yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold">Campaigns</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{campaign.name}</p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-500">
                      {campaign.id}
                    </p>
                  </td>
                  <td className="px-5 py-4">{campaign.status}</td>
                  <td className="px-5 py-4">
                    {formatDate(campaign.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    {formatDate(campaign.updatedAt)}
                  </td>
                </tr>
              ))}

              {campaigns.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={4}>
                    No campaigns have been created for this organisation yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
