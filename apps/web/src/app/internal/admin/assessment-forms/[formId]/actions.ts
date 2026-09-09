'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  assignResearcherToSection,
  updateAssessmentFormPublication,
  type AssessmentFormStatus,
} from '../_lib/assessment-authoring-api';

const detailPath = (formId: string) =>
  `/internal/admin/assessment-forms/${encodeURIComponent(formId)}`;

const fail = (formId: string, reason: string): never => {
  redirect(`${detailPath(formId)}?error=${encodeURIComponent(reason)}`);
};

export async function updateAssessmentFormPublicationAction(
  formId: string,
  formData: FormData
) {
  const formStatus = String(
    formData.get('formStatus') ?? ''
  ) as AssessmentFormStatus;

  if (!['DRAFT', 'INTERNAL', 'PUBLIC', 'ARCHIVED'].includes(formStatus)) {
    fail(formId, 'invalid-status');
  }

  try {
    await updateAssessmentFormPublication(formId, formStatus);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'update-failed';

    console.error('Update assessment form publication failed:', message);

    fail(formId, message.slice(0, 180));
  }

  revalidatePath(detailPath(formId));
  revalidatePath('/internal/admin/assessment-forms');

  redirect(`${detailPath(formId)}?updated=publication`);
}

export async function assignResearcherToSectionAction(
  formId: string,
  sectionId: string,
  formData: FormData
) {
  const researcherId = String(formData.get('researcherId') ?? '').trim();
  const targetItemCount = Number(formData.get('targetItemCount') ?? 0);
  const notes = String(formData.get('notes') ?? '').trim();
  const dueAt = String(formData.get('dueAt') ?? '').trim();

  if (!researcherId) {
    fail(formId, 'researcher-required');
  }

  if (!Number.isFinite(targetItemCount) || targetItemCount < 0) {
    fail(formId, 'invalid-target');
  }

  try {
    await assignResearcherToSection({
      formId,
      sectionId,
      researcherId,
      targetItemCount: Math.trunc(targetItemCount),
      notes: notes || null,
      dueAt: dueAt || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'assign-failed';

    console.error('Assign researcher failed:', message);

    fail(formId, message.slice(0, 180));
  }

  revalidatePath(detailPath(formId));

  redirect(`${detailPath(formId)}?updated=assignment`);
}
