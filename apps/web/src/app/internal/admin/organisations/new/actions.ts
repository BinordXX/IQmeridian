'use server';

import { redirect } from 'next/navigation';

import { createInternalOrganisation } from '../../../_lib/internal-api';

const fail = (reason: string): never => {
  redirect(
    `/internal/admin/organisations/new?error=${encodeURIComponent(reason)}`
  );
};

export async function createOrganisationAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();

  if (!name) {
    fail('name-required');
  }

  let organisationId: string | null = null;

  try {
    const organisation = await createInternalOrganisation({ name });
    organisationId = organisation.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'create-failed';

    console.error('Create organisation failed:', message);

    fail(message.slice(0, 180));
  }

  if (!organisationId) {
    fail('create-failed');
  }

  redirect(`/internal/admin/organisations/${organisationId}?updated=created`);
}
