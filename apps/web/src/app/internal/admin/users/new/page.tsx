import Link from 'next/link';

import {
  fetchInternalOrganisations,
  internalUserRoleLabels,
  internalUserStatusLabels,
  type InternalUserRole,
  type InternalUserStatus,
} from '../../../_lib/internal-api';
import { createInternalUserAction } from './actions';

type NewUserPageProps = {
  searchParams?: Promise<{
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

const errorMessages: Record<string, string> = {
  'invalid-input': 'Enter an email, password, and valid role.',
  'invalid-status': 'Select a valid account status.',
  'weak-password': 'Password must be at least 12 characters.',
  'organisation-required':
    'Employer admin accounts must be attached to an organisation.',
  'create-failed':
    'The user could not be created. The email may already exist or the input may be invalid.',
};

export default async function NewInternalUserPage({
  searchParams,
}: NewUserPageProps) {
  const resolvedSearchParams = await searchParams;
  const organisations = await fetchInternalOrganisations();

  const rawError = resolvedSearchParams?.error;

  const errorMessage = rawError ? (errorMessages[rawError] ?? rawError) : null;

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
          User management
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Create platform user
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Create a managed account for platform admins, researchers, employer
          admins, consumers, or candidates. The user can sign in with the
          password set here.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <form
        action={createInternalUserAction}
        autoComplete="off"
        className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2"
      >
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            autoComplete="off"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            id="email"
            name="email"
            required
            type="email"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Name
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            id="name"
            name="name"
            type="text"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="role">
            Role
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            defaultValue="RESEARCHER"
            id="role"
            name="role"
            required
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {internalUserRoleLabels[role]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="status"
          >
            Status
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            defaultValue="ACTIVE"
            id="status"
            name="status"
            required
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {internalUserStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="organisationId"
          >
            Organisation
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            id="organisationId"
            name="organisationId"
          >
            <option value="">No organisation</option>
            {organisations.map((organisation) => (
              <option key={organisation.id} value={organisation.id}>
                {organisation.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">
            Required for employer admin accounts.
          </p>
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="password"
          >
            Temporary password
          </label>
          <input
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            id="password"
            minLength={12}
            name="password"
            required
            type="password"
          />
          <p className="mt-2 text-xs text-slate-500">
            Use at least 12 characters. The user should change this later once
            password-reset tooling exists.
          </p>
        </div>

        <div className="lg:col-span-2">
          <button
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            type="submit"
          >
            Create user
          </button>
        </div>
      </form>
    </section>
  );
}
