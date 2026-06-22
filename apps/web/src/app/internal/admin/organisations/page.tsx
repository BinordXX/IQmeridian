import Link from 'next/link';

import { fetchInternalOrganisations } from '../../_lib/internal-api';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default async function InternalAdminOrganisationsPage() {
  const organisations = await fetchInternalOrganisations();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Organisation management
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Organisations
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review employer organisations, their users, employer admins, and
            campaigns from the platform admin workspace.
          </p>
        </div>

        <Link
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          href="/internal/admin/organisations/new"
        >
          Create organisation
        </Link>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold">
            {organisations.length} organisations
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Organisation</th>
                <th className="px-5 py-3">Users</th>
                <th className="px-5 py-3">Employer admins</th>
                <th className="px-5 py-3">Campaigns</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {organisations.map((organisation) => {
                const users = organisation.users ?? [];
                const campaigns = organisation.campaigns ?? [];
                const employerAdmins = users.filter(
                  (user) => user.role === 'EMPLOYER_ADMIN'
                );

                return (
                  <tr key={organisation.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">
                        {organisation.name}
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        {organisation.id}
                      </p>
                    </td>
                    <td className="px-5 py-4">{users.length}</td>
                    <td className="px-5 py-4">{employerAdmins.length}</td>
                    <td className="px-5 py-4">{campaigns.length}</td>
                    <td className="px-5 py-4">
                      {formatDate(organisation.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                        href={`/internal/admin/organisations/${organisation.id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
