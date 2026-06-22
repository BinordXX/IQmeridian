import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { redirect } from 'next/navigation';

import { setConsumerDefaultAssessmentAction } from './actions';

type InternalAssessmentForm = {
  id: string;
  name?: string | null;
  isActive?: boolean;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ConsumerDefaultSetting = {
  isConfigured: boolean;
  isEnabled: boolean;
  assessmentFormId: string | null;
  assessmentForm: InternalAssessmentForm | null;
  updatedByUserId: string | null;
  updatedAt: string | null;
};

type PageProps = {
  searchParams?: Promise<{
    updated?: string;
    error?: string;
  }>;
};

const getAccessToken = async () => {
  const session = await auth();

  if (session?.user.role !== 'PLATFORM_ADMIN') {
    redirect('/internal');
  }

  if (!session.accessToken) {
    redirect('/staff/login?callbackUrl=/internal/admin/consumer-assessment');
  }

  return session.accessToken;
};

const requestApi = async <T,>(path: string): Promise<T> => {
  const accessToken = await getAccessToken();

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Internal request failed for ${path}.`);
  }

  return response.json() as Promise<T>;
};

const normaliseForms = (value: unknown): InternalAssessmentForm[] => {
  if (Array.isArray(value)) return value as InternalAssessmentForm[];

  if (
    value &&
    typeof value === 'object' &&
    'forms' in value &&
    Array.isArray((value as { forms?: unknown }).forms)
  ) {
    return (value as { forms: InternalAssessmentForm[] }).forms;
  }

  if (
    value &&
    typeof value === 'object' &&
    'items' in value &&
    Array.isArray((value as { items?: unknown }).items)
  ) {
    return (value as { items: InternalAssessmentForm[] }).items;
  }

  return [];
};

export default async function ConsumerAssessmentAdminPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = await searchParams;

  const [formsResponse, defaultSetting] = await Promise.all([
    requestApi<unknown>('/internal/forms'),
    requestApi<ConsumerDefaultSetting>('/internal/consumer-assessment/default'),
  ]);

  const forms = normaliseForms(formsResponse);
  const activeForms = forms.filter((form) => form.isActive);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Consumer assessment
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Public consumer default
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Select the active assessment form that self-service consumers will see
          on their dashboard and use when starting a new assessment.
        </p>
      </div>

      {resolvedSearchParams?.updated ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          Consumer default assessment updated.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          The consumer default assessment could not be updated.
        </div>
      ) : null}

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Current default</h2>

        {defaultSetting.assessmentForm ? (
          <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">Assessment form</dt>
              <dd className="mt-1 font-semibold">
                {defaultSetting.assessmentForm.name ??
                  defaultSetting.assessmentForm.id}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">Status</dt>
              <dd className="mt-1 font-semibold">
                {defaultSetting.assessmentForm.isActive ? 'Active' : 'Inactive'}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">Form ID</dt>
              <dd className="mt-1 break-all font-mono text-xs">
                {defaultSetting.assessmentFormId}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">Updated</dt>
              <dd className="mt-1 font-semibold">
                {defaultSetting.updatedAt ?? 'Not available'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            No consumer default assessment has been selected yet.
          </p>
        )}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Set consumer default</h2>

        {activeForms.length > 0 ? (
          <form action={setConsumerDefaultAssessmentAction} className="mt-5">
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="assessmentFormId"
            >
              Active assessment form
            </label>

            <select
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              defaultValue={defaultSetting.assessmentFormId ?? ''}
              id="assessmentFormId"
              name="assessmentFormId"
              required
            >
              <option disabled value="">
                Select an active form
              </option>

              {activeForms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name ?? form.id}
                </option>
              ))}
            </select>

            <button
              className="mt-5 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              type="submit"
            >
              Save consumer default
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            There are no active forms available. Activate a form first, then
            return to this page.
          </p>
        )}
      </article>
    </section>
  );
}
