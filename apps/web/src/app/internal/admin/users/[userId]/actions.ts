'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  updateInternalUserOrganisation,
  updateInternalUserRole,
  updateInternalUserStatus,
  type InternalUserRole,
  type InternalUserStatus,
} from '../../../_lib/internal-api';

const validRoles: InternalUserRole[] = [
  'CONSUMER',
  'CANDIDATE',
  'RESEARCHER',
  'EMPLOYER_ADMIN',
  'PLATFORM_ADMIN',
];

const validStatuses: InternalUserStatus[] = ['ACTIVE', 'SUSPENDED', 'DISABLED'];

export async function updateUserRoleAction(userId: string, formData: FormData) {
  const role = String(formData.get('role') ?? '') as InternalUserRole;

  if (!validRoles.includes(role)) {
    redirect(`/internal/admin/users/${userId}?error=invalid-role`);
  }

  await updateInternalUserRole({
    userId,
    input: {
      role,
    },
  });

  revalidatePath(`/internal/admin/users/${userId}`);
  revalidatePath('/internal/admin/users');

  redirect(`/internal/admin/users/${userId}?updated=role`);
}

export async function updateUserStatusAction(
  userId: string,
  formData: FormData
) {
  const status = String(formData.get('status') ?? '') as InternalUserStatus;

  if (!validStatuses.includes(status)) {
    redirect(`/internal/admin/users/${userId}?error=invalid-status`);
  }

  await updateInternalUserStatus({
    userId,
    input: {
      status,
    },
  });

  revalidatePath(`/internal/admin/users/${userId}`);
  revalidatePath('/internal/admin/users');

  redirect(`/internal/admin/users/${userId}?updated=status`);
}

export async function updateUserOrganisationAction(
  userId: string,
  formData: FormData
) {
  const rawOrganisationId = String(formData.get('organisationId') ?? '');
  const organisationId = rawOrganisationId.trim() || null;

  await updateInternalUserOrganisation({
    userId,
    input: {
      organisationId,
    },
  });

  revalidatePath(`/internal/admin/users/${userId}`);
  revalidatePath('/internal/admin/users');

  redirect(`/internal/admin/users/${userId}?updated=organisation`);
}
