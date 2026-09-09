import Link from 'next/link';

import {
  fetchAssessmentForm,
  fetchResearchers,
  fetchSectionAssignments,
  type AssessmentFormStatus,
  type ResearcherAssignment,
} from '../_lib/assessment-authoring-api';
import {
  assignResearcherToSectionAction,
  updateAssessmentFormPublicationAction,
} from './actions';

export const dynamic = 'force-dynamic';

type AssessmentFormDetailPageProps = {
  params: Promise<{
    formId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    updated?: string;
  }>;
};

const statusOptions: AssessmentFormStatus[] = [
  'DRAFT',
  'INTERNAL',
  'PUBLIC',
  'ARCHIVED',
];

const errorMessages: Record<string, string> = {
  'invalid-status': 'Select a valid publication status.',
  'researcher-required': 'Select a researcher.',
  'invalid-target': 'Enter a valid target item count.',
  'update-failed': 'The form publication status could not be updated.',
  'assign-failed': 'The researcher could not be assigned.',
};

const updatedMessages: Record<string, string> = {
  created: 'Assessment form created.',
  publication: 'Publication status updated.',
  assignment: 'Researcher assignment created.',
};

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

const getSectionActiveItemCount = (
  formItems: Awaited<ReturnType<typeof fetchAssessmentForm>>['items'],
  sectionId: string
) =>
  formItems.filter(
    (mapping) =>
      mapping.sectionId === sectionId &&
      mapping.status === 'ACTIVE' &&
      mapping.item?.status === 'ACTIVE'
  ).length;

const getAssignmentCount = (
  assignmentsBySection: Map<string, ResearcherAssignment[]>,
  sectionId: string
) => assignmentsBySection.get(sectionId)?.length ?? 0;

export default async function AssessmentFormDetailPage({
  params,
  searchParams,
}: AssessmentFormDetailPageProps) {
  const { formId } = await params;
  const resolvedSearchParams = await searchParams;

  const [form, researchers] = await Promise.all([
    fetchAssessmentForm(formId),
    fetchResearchers(),
  ]);

  const assignmentsEntries = await Promise.all(
    form.sections.map(async (section) => [
      section.id,
      await fetchSectionAssignments(form.id, section.id),
    ])
  );

  const assignmentsBySection = new Map(
    assignmentsEntries as Array<[string, ResearcherAssignment[]]>
  );

  const rawError = resolvedSearchParams?.error;
  const rawUpdated = resolvedSearchParams?.updated;

  const errorMessage = rawError ? (errorMessages[rawError] ?? rawError) : null;
  const updatedMessage = rawUpdated
    ? (updatedMessages[rawUpdated] ?? 'Changes saved.')
    : null;

  const activeItems = form.items.filter(
    (mapping) =>
      mapping.status === 'ACTIVE' && mapping.item?.status === 'ACTIVE'
  ).length;

  const publicationAction = updateAssessmentFormPublicationAction.bind(
    null,
    form.id
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          className="text-sm font-semibold text-slate-400 underline-offset-4 hover:text-cyan-100 hover:underline"
          href="/internal/admin/assessment-forms"
        >
          ← Back to assessment forms
        </Link>
      </div>

      {errorMessage ? (
        <section className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">
          {errorMessage}
        </section>
      ) : null}

      {updatedMessage ? (
        <section className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">
          {updatedMessage}
        </section>
      ) : null}

      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.18),transparent_32%)]"
        />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_360px]">
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

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
              {form.name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Version {form.versionLabel ?? form.version}. This form contains{' '}
              {form.sections.length} sections, {activeItems} active mapped
              items, and {form._count?.sectionAssignments ?? 0} section
              assignments.
            </p>
          </div>

          <form
            action={publicationAction}
            className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"
          >
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Publication status
              </span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
                defaultValue={form.formStatus}
                name="formStatus"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="mt-4 w-full rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
              type="submit"
            >
              Save publication status
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-5">
        {form.sections.map((section) => {
          const sectionAssignments = assignmentsBySection.get(section.id) ?? [];
          const activeSectionItems = getSectionActiveItemCount(
            form.items,
            section.id
          );
          const sectionAssignmentAction = assignResearcherToSectionAction.bind(
            null,
            form.id,
            section.id
          );

          return (
            <article
              className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
              key={section.id}
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    {section.domain}
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">
                    {section.title}
                  </h2>

                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Active
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {activeSectionItems}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Target
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {section.targetBankItemCount}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Delivery
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {section.deliveryItemCount}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Assignments
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {getAssignmentCount(assignmentsBySection, section.id)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {sectionAssignments.length > 0 ? (
                      sectionAssignments.map((assignment) => (
                        <div
                          className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                          key={assignment.id}
                        >
                          <p className="text-sm font-black text-white">
                            {assignment.researcher.name ??
                              assignment.researcher.email}
                          </p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            {assignment.status} · Target{' '}
                            {assignment.targetItemCount} items · Created{' '}
                            {assignment._count?.items ?? 0}
                          </p>
                          {assignment.notes ? (
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {assignment.notes}
                            </p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-bold text-slate-500">
                        No researcher has been assigned to this section.
                      </p>
                    )}
                  </div>
                </div>

                <form
                  action={sectionAssignmentAction}
                  className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"
                >
                  <h3 className="text-sm font-black text-white">
                    Assign researcher
                  </h3>

                  <label className="mt-4 block space-y-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Researcher
                    </span>
                    <select
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
                      name="researcherId"
                      required
                    >
                      <option value="">Select researcher</option>
                      {researchers.map((researcher) => (
                        <option key={researcher.id} value={researcher.id}>
                          {researcher.name ?? researcher.email}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="mt-4 block space-y-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Target item count
                    </span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
                      defaultValue={section.targetBankItemCount}
                      min={0}
                      name="targetItemCount"
                      type="number"
                    />
                  </label>

                  <label className="mt-4 block space-y-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Due date
                    </span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
                      name="dueAt"
                      type="date"
                    />
                  </label>

                  <label className="mt-4 block space-y-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Notes
                    </span>
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/40"
                      name="notes"
                      placeholder="Assignment notes for the researcher"
                    />
                  </label>

                  <button
                    className="mt-4 w-full rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                    type="submit"
                  >
                    Assign researcher
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
