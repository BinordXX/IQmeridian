import Link from 'next/link';

import {
  fetchAssessmentForms,
  type AssessmentForm,
  type AssessmentFormStatus,
} from './_lib/assessment-authoring-api';

export const dynamic = 'force-dynamic';

type AssessmentFormsPageProps = {
  searchParams?: Promise<{
    status?: AssessmentFormStatus;
  }>;
};

const statusFilters: Array<{
  label: string;
  value?: AssessmentFormStatus;
  href: string;
}> = [
  { label: 'All', href: '/internal/admin/assessment-forms' },
  {
    label: 'Draft',
    value: 'DRAFT',
    href: '/internal/admin/assessment-forms?status=DRAFT',
  },
  {
    label: 'Internal',
    value: 'INTERNAL',
    href: '/internal/admin/assessment-forms?status=INTERNAL',
  },
  {
    label: 'Public',
    value: 'PUBLIC',
    href: '/internal/admin/assessment-forms?status=PUBLIC',
  },
  {
    label: 'Archived',
    value: 'ARCHIVED',
    href: '/internal/admin/assessment-forms?status=ARCHIVED',
  },
];

const getStatusClassName = (status: string) => {
  if (status === 'PUBLIC') {
    return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
  }

  if (status === 'INTERNAL') {
    return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
  }

  if (status === 'ARCHIVED') {
    return 'border-red-300/20 bg-red-400/10 text-red-100';
  }

  return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
};

const getCoverage = (form: AssessmentForm) => {
  const activeItems = form.items.filter(
    (mapping) =>
      mapping.status === 'ACTIVE' && mapping.item?.status === 'ACTIVE'
  ).length;

  const target =
    form.targetBankItemCount > 0 ? form.targetBankItemCount : activeItems;

  const percentage = target > 0 ? Math.round((activeItems / target) * 100) : 0;

  return {
    activeItems,
    target,
    percentage,
  };
};

export default async function AssessmentFormsPage({
  searchParams,
}: AssessmentFormsPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedStatus = resolvedSearchParams?.status;

  let forms: AssessmentForm[] = [];
  let errorMessage: string | null = null;

  try {
    forms = await fetchAssessmentForms(selectedStatus);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : 'Unable to load assessment forms.';
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.18),transparent_32%)]"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Assessment authoring
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              Assessment Forms
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Create production assessment forms, track section coverage, assign
              researchers, and control publication state before consumer
              delivery.
            </p>
          </div>

          <Link
            className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.25)] transition hover:bg-cyan-200"
            href="/internal/admin/assessment-forms/new"
          >
            Create form
          </Link>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const isSelected = selectedStatus
            ? filter.value === selectedStatus
            : !filter.value;

          return (
            <Link
              className={
                isSelected
                  ? 'rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100'
                  : 'rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400 transition hover:border-cyan-300/20 hover:text-cyan-100'
              }
              href={filter.href}
              key={filter.href}
            >
              {filter.label}
            </Link>
          );
        })}
      </section>

      {errorMessage ? (
        <section className="rounded-[2rem] border border-red-300/20 bg-red-500/10 p-5 text-sm font-bold text-red-100">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-5">
        {forms.length > 0 ? (
          forms.map((form) => {
            const coverage = getCoverage(form);

            return (
              <Link
                className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition hover:border-cyan-300/25 hover:bg-[#0b1c3f]"
                href={`/internal/admin/assessment-forms/${form.id}`}
                key={form.id}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${getStatusClassName(
                          form.formStatus
                        )}`}
                      >
                        {form.formStatus}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300">
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <h2 className="mt-4 text-xl font-black text-white">
                      {form.name}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Version {form.versionLabel ?? form.version} ·{' '}
                      {form.sections.length} sections ·{' '}
                      {form._count?.sectionAssignments ?? 0} assignments
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Active items
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {coverage.activeItems}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Target bank
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {coverage.target}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Coverage
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {coverage.percentage}%
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-10 text-center">
            <p className="text-sm font-bold text-slate-400">
              No assessment forms found for this filter.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}
