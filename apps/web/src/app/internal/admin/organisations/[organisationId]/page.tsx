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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </article>
  );
}

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
  const existingOrganisationUserIds = new Set(
    organisationUsers.map((user) => user.id)
  );

  const attachableUsers = users.filter((user) => {
    if (user.status !== 'ACTIVE') return false;
    if (user.role !== 'EMPLOYER_ADMIN') return false;
    if (existingOrganisationUserIds.has(user.id)) return false;

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
          className="text-sm font-bold text-slate-500 underline-offset-4 transition hover:text-cyan-300 hover:underline"
          href="/internal/admin/organisations"
        >
          ← Back to organisations
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
          Organisation profile
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          {organisation.name}
        </h1>

        <p className="mt-2 break-all font-mono text-xs text-slate-500">
          {organisation.id}
        </p>
      </div>

      {resolvedSearchParams?.updated ? (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">
          Organisation updated successfully.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold text-red-100">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Users" value={organisationUsers.length} />
        <StatCard label="Employer admins" value={employerAdmins.length} />
        <StatCard label="Campaigns" value={campaigns.length} />
        <StatCard label="Created" value={formatDate(organisation.createdAt)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <h2 className="text-lg font-black text-white">Rename organisation</h2>

          <form action={updateOrganisation} className="mt-5 space-y-4">
            <input
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
              defaultValue={organisation.name}
              name="name"
              required
              type="text"
            />

            <button
              className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
              type="submit"
            >
              Save name
            </button>
          </form>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <h2 className="text-lg font-black text-white">
            Attach employer admin
          </h2>

          <p className="mt-2 text-sm leading-7 text-slate-400">
            Select an active employer-admin account that is not already attached
            to this organisation. Consumer accounts are intentionally excluded
            because consumer and employer identities are separated.
          </p>

          <form action={attachEmployerAdmin} className="mt-5 space-y-4">
            <select
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
              name="userId"
              required
            >
              <option value="">Select employer admin</option>
              {attachableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email} — {internalUserRoleLabels[user.role]}
                </option>
              ))}
            </select>

            <button
              className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
              type="submit"
            >
              Attach as employer admin
            </button>
          </form>
        </article>
      </div>

      <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/90 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">
            Users in organisation
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-white/10 bg-[#020817]/70 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last login</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {organisationUsers.map((user) => (
                <tr
                  className="text-slate-300 transition hover:bg-[#020817]/50"
                  key={user.id}
                >
                  <td className="px-5 py-4">
                    <p className="font-black text-white">
                      {user.name ?? user.email}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {user.email}
                    </p>
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
                      className="font-black text-cyan-300 underline-offset-4 hover:underline"
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

      <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/90 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">Campaigns</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="border-b border-white/10 bg-[#020817]/70 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {campaigns.map((campaign) => (
                <tr
                  className="text-slate-300 transition hover:bg-[#020817]/50"
                  key={campaign.id}
                >
                  <td className="px-5 py-4">
                    <p className="font-black text-white">{campaign.name}</p>
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
