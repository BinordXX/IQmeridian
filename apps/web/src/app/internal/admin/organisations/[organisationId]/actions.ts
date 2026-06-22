'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  attachEmployerAdminToOrganisation,
  updateInternalOrganisation,
} from '../../../_lib/internal-api';

const detailPath = (organisationId: string) => {
  return `/internal/admin/organisations/${organisationId}`;
};

const fail = (organisationId: string, reason: string): never => {
  redirect(`${detailPath(organisationId)}?error=${encodeURIComponent(reason)}`);
};

export async function updateOrganisationAction(
  organisationId: string,
  formData: FormData
) {
  const name = String(formData.get('name') ?? '').trim();

  if (!name) {
    fail(organisationId, 'name-required');
  }

  try {
    await updateInternalOrganisation({
      organisationId,
      input: { name },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'update-failed';

    console.error('Update organisation failed:', message);

    fail(organisationId, message.slice(0, 180));
  }

  revalidatePath(detailPath(organisationId));
  revalidatePath('/internal/admin/organisations');

  redirect(`${detailPath(organisationId)}?updated=organisation`);
}

export async function attachEmployerAdminAction(
  organisationId: string,
  formData: FormData
) {
  const userId = String(formData.get('userId') ?? '').trim();

  if (!userId) {
    fail(organisationId, 'user-required');
  }

  try {
    await attachEmployerAdminToOrganisation({
      organisationId,
      input: { userId },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'attach-failed';

    console.error('Attach employer admin failed:', message);

    fail(organisationId, message.slice(0, 180));
  }

  revalidatePath(detailPath(organisationId));
  revalidatePath('/internal/admin/organisations');
  revalidatePath('/internal/admin/users');

  redirect(`${detailPath(organisationId)}?updated=employer-admin`);
}
