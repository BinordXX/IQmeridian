import Link from 'next/link';

import { FormManagementClient } from '../../_components/form-management-client';
import { fetchInternalAssessmentForms } from '../../_lib/internal-api';

export default async function InternalFormsPage() {
  const forms = await fetchInternalAssessmentForms();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Researcher tooling
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Assessment forms
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Create reusable assessment forms, define cognitive-domain blueprint
            targets, and prepare forms for item placement, validation, locking,
            and activation.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/internal/researcher/item-bank"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Item bank
          </Link>

          <Link
            href="/internal/researcher/pilot-forms"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Pilot governance
          </Link>
        </div>
      </div>

      <FormManagementClient initialForms={forms} />
    </main>
  );
}