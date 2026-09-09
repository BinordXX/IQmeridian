import Link from 'next/link';

import { createAssessmentFormAction } from './actions';

type NewAssessmentFormPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  'name-required': 'Enter an assessment form name.',
  'create-failed': 'The assessment form could not be created.',
};

export default async function NewAssessmentFormPage({
  searchParams,
}: NewAssessmentFormPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawError = resolvedSearchParams?.error;
  const errorMessage = rawError ? (errorMessages[rawError] ?? rawError) : null;

  return (
    <section className="space-y-6">
      <div>
        <Link
          className="text-sm font-semibold text-slate-400 underline-offset-4 hover:text-cyan-100 hover:underline"
          href="/internal/admin/assessment-forms"
        >
          ← Back to assessment forms
        </Link>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
          Create assessment form
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          This creates a draft production assessment form with the six approved
          IQMeridian cognitive sections.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <form
        action={createAssessmentFormAction}
        className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Form name
            </span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
              name="name"
              placeholder="IQMeridian Cognitive Assessment"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Version label
            </span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
              defaultValue="v1"
              name="versionLabel"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Target bank items
            </span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/40"
              defaultValue={480}
              min={0}
              name="targetBankItemCount"
              type="number"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Public delivery items
            </span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/40"
              defaultValue={30}
              min={0}
              name="deliveryItemCount"
              type="number"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Section target items
            </span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/40"
              defaultValue={80}
              min={0}
              name="sectionTargetItemCount"
              type="number"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Section delivery items
            </span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/40"
              defaultValue={5}
              min={0}
              name="sectionDeliveryItemCount"
              type="number"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Section time limit, seconds
            </span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/40"
              defaultValue={900}
              min={0}
              name="sectionTimeLimitSec"
              type="number"
            />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-50">
          The form will be created as a draft. Publish it only after sections
          have active approved items.
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.25)] transition hover:bg-cyan-200"
            type="submit"
          >
            Create draft form
          </button>
        </div>
      </form>
    </section>
  );
}
