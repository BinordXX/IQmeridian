import Link from 'next/link';

import { createOrganisationAction } from './actions';

type NewOrganisationPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  'name-required': 'Enter an organisation name.',
  'create-failed': 'The organisation could not be created.',
};

export default async function NewOrganisationPage({
  searchParams,
}: NewOrganisationPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawError = resolvedSearchParams?.error;
  const errorMessage = rawError ? (errorMessages[rawError] ?? rawError) : null;

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
          Organisation management
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Create organisation
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Add an employer organisation that can later receive employer admins,
          campaigns, invitations, sessions, and reports.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <form
        action={createOrganisationAction}
        className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="text-sm font-medium text-slate-700" htmlFor="name">
          Organisation name
        </label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          id="name"
          name="name"
          required
          type="text"
        />

        <button
          className="mt-6 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          type="submit"
        >
          Create organisation
        </button>
      </form>
    </section>
  );
}
