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
      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Organisation management
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              Organisations
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Review employer organisations, their users, employer admins, and
              campaigns from the platform admin workspace.
            </p>
          </div>

          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
            href="/internal/admin/organisations/new"
          >
            Create organisation
          </Link>
        </div>
      </header>

      <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/90 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">
            {organisations.length} organisations
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-[#020817]/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Organisation</th>
                <th className="px-5 py-3">Users</th>
                <th className="px-5 py-3">Employer admins</th>
                <th className="px-5 py-3">Campaigns</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {organisations.map((organisation) => {
                const users = organisation.users ?? [];
                const campaigns = organisation.campaigns ?? [];
                const employerAdmins = users.filter(
                  (user) => user.role === 'EMPLOYER_ADMIN'
                );

                return (
                  <tr key={organisation.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-black text-white">
                        {organisation.name}
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        {organisation.id}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-300">
                      {users.length}
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-300">
                      {employerAdmins.length}
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-300">
                      {campaigns.length}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {formatDate(organisation.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        className="font-black text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline"
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

          {organisations.length === 0 ? (
            <p className="border-t border-white/10 px-5 py-10 text-center text-sm text-slate-500">
              No organisations are currently available.
            </p>
          ) : null}
        </div>
      </article>
    </section>
  );
}
