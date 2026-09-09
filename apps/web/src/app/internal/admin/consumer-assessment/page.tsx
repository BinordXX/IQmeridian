import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';

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

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
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
      <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Consumer assessment
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Public consumer default
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            Select the active assessment form that self-service consumers will
            see on their dashboard and use when starting a new assessment.
          </p>
        </div>
      </header>

      {resolvedSearchParams?.updated ? (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">
          Consumer default assessment updated.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold text-red-100">
          The consumer default assessment could not be updated.
        </div>
      ) : null}

      <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <h2 className="text-xl font-black text-white">Current default</h2>

        {defaultSetting.assessmentForm ? (
          <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
              <dt className="font-bold text-slate-400">Assessment form</dt>
              <dd className="mt-2 font-black text-white">
                {defaultSetting.assessmentForm.name ??
                  defaultSetting.assessmentForm.id}
              </dd>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
              <dt className="font-bold text-slate-400">Status</dt>
              <dd className="mt-2 font-black text-white">
                {defaultSetting.assessmentForm.isActive ? 'Active' : 'Inactive'}
              </dd>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
              <dt className="font-bold text-slate-400">Form ID</dt>
              <dd className="mt-2 break-all font-mono text-xs text-cyan-100">
                {defaultSetting.assessmentFormId}
              </dd>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
              <dt className="font-bold text-slate-400">Updated</dt>
              <dd className="mt-2 font-black text-white">
                {formatDate(defaultSetting.updatedAt)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-400">
            No consumer default assessment has been selected yet.
          </p>
        )}
      </article>

      <article className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <h2 className="text-xl font-black text-white">Set consumer default</h2>

        {activeForms.length > 0 ? (
          <form action={setConsumerDefaultAssessmentAction} className="mt-5">
            <label
              className="block text-sm font-bold text-slate-300"
              htmlFor="assessmentFormId"
            >
              Active assessment form
            </label>

            <select
              className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
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
              className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
              type="submit"
            >
              Save consumer default
            </button>
          </form>
        ) : (
          <p className="mt-4 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-400">
            There are no active forms available. Activate a form first, then
            return to this page.
          </p>
        )}
      </article>
    </section>
  );
}
