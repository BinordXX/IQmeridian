'use server';

import { redirect } from 'next/navigation';

import {
  createAssessmentForm,
  type AssessmentDomain,
  type AssessmentSectionType,
} from '../_lib/assessment-authoring-api';

const defaultSections: Array<{
  type: AssessmentSectionType;
  domain: AssessmentDomain;
  title: string;
  orderIndex: number;
}> = [
  {
    type: 'VERBAL',
    domain: 'VERBAL_REASONING',
    title: 'Verbal Reasoning',
    orderIndex: 0,
  },
  {
    type: 'NUMERICAL',
    domain: 'NUMERICAL_REASONING',
    title: 'Numerical Reasoning',
    orderIndex: 1,
  },
  {
    type: 'ABSTRACT',
    domain: 'ABSTRACT_REASONING',
    title: 'Abstract Reasoning',
    orderIndex: 2,
  },
  {
    type: 'LOGICAL',
    domain: 'LOGICAL_REASONING',
    title: 'Logical Reasoning',
    orderIndex: 3,
  },
  {
    type: 'ANALYTICAL',
    domain: 'ANALYTICAL_PROBLEM_SOLVING',
    title: 'Analytical Problem-Solving',
    orderIndex: 4,
  },
  {
    type: 'SPATIAL',
    domain: 'SPATIAL_REASONING',
    title: 'Spatial Reasoning',
    orderIndex: 5,
  },
];

const fail = (reason: string): never => {
  redirect(
    `/internal/admin/assessment-forms/new?error=${encodeURIComponent(reason)}`
  );
};

const toPositiveInteger = (
  value: FormDataEntryValue | null,
  fallback: number
) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return Math.trunc(parsedValue);
};

export async function createAssessmentFormAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const versionLabel = String(formData.get('versionLabel') ?? '').trim();
  const targetBankItemCount = toPositiveInteger(
    formData.get('targetBankItemCount'),
    480
  );
  const deliveryItemCount = toPositiveInteger(
    formData.get('deliveryItemCount'),
    30
  );
  const sectionTargetItemCount = toPositiveInteger(
    formData.get('sectionTargetItemCount'),
    80
  );
  const sectionDeliveryItemCount = toPositiveInteger(
    formData.get('sectionDeliveryItemCount'),
    5
  );
  const sectionTimeLimitSec = toPositiveInteger(
    formData.get('sectionTimeLimitSec'),
    900
  );

  if (!name) {
    fail('name-required');
  }

  let formId: string | null = null;

  try {
    const form = await createAssessmentForm({
      name,
      version: 1,
      versionLabel: versionLabel || 'v1',
      isActive: false,
      formStatus: 'DRAFT',
      targetBankItemCount,
      deliveryItemCount,
      randomizeItems: true,
      randomizeOptions: true,
      sections: defaultSections.map((section) => ({
        ...section,
        timeLimitSec: sectionTimeLimitSec,
        targetBankItemCount: sectionTargetItemCount,
        deliveryItemCount: sectionDeliveryItemCount,
      })),
    });

    formId = form.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'create-failed';

    console.error('Create assessment form failed:', message);

    fail(message.slice(0, 180));
  }

  if (!formId) {
    fail('create-failed');
  }

  redirect(`/internal/admin/assessment-forms/${formId}?updated=created`);
}
