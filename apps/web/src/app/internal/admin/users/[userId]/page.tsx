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

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
      <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </dt>
      <dd
        className={[
          'mt-2 break-all font-bold text-white',
          mono ? 'font-mono text-xs' : 'text-sm',
        ].join(' ')}
      >
        {value}
      </dd>
    </div>
  );
}

function AdminFormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <h2 className="text-lg font-black text-white">{title}</h2>
      {children}
    </article>
  );
}

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
          className="text-sm font-bold text-slate-500 underline-offset-4 transition hover:text-cyan-300 hover:underline"
          href="/internal/admin/users"
        >
          ← Back to users
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
          User profile
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          {user.name ?? user.email}
        </h1>

        <p className="mt-2 break-all text-sm text-slate-500">{user.email}</p>
      </div>

      {resolvedSearchParams?.updated ? (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">
          User updated successfully.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold text-red-100">
          User update failed.
        </div>
      ) : null}

      <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <h2 className="text-xl font-black text-white">Account details</h2>

        <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
          <DetailField label="User ID" value={user.id} mono />
          <DetailField label="Email" value={user.email} />
          <DetailField label="Name" value={user.name ?? 'Not set'} />
          <DetailField
            label="Role"
            value={internalUserRoleLabels[user.role] ?? user.role}
          />
          <DetailField
            label="Status"
            value={internalUserStatusLabels[user.status] ?? user.status}
          />
          <DetailField
            label="Organisation"
            value={user.organisation?.name ?? user.organisationId ?? 'None'}
          />
          <DetailField
            label="Last login"
            value={formatDate(user.lastLoginAt)}
          />
          <DetailField label="Created" value={formatDate(user.createdAt)} />
        </dl>
      </article>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminFormCard title="Change role">
          <form action={updateRole} className="mt-5 space-y-4">
            <select
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
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
              className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
              type="submit"
            >
              Save role
            </button>
          </form>
        </AdminFormCard>

        <AdminFormCard title="Change status">
          <form action={updateStatus} className="mt-5 space-y-4">
            <select
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
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
              className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
              type="submit"
            >
              Save status
            </button>
          </form>
        </AdminFormCard>

        <AdminFormCard title="Assign organisation">
          <form action={updateOrganisation} className="mt-5 space-y-4">
            <select
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
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
              className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
              type="submit"
            >
              Save organisation
            </button>
          </form>
        </AdminFormCard>
      </div>
    </section>
  );
}
