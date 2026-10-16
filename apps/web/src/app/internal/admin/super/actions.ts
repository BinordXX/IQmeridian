'use server';

import { revalidatePath } from 'next/cache';

import {
  revokeSuperAdminAccountSessions,
  type SuperAdminAccountStatus,
  updateSuperAdminAccountStatus,
} from './_lib/super-admin-api';

export async function updateSuperAdminStatusAction(
  userId: string,
  status: SuperAdminAccountStatus,
  formData: FormData
) {
  void formData;

  await updateSuperAdminAccountStatus({
    userId,
    status,
  });

  revalidatePath('/internal/admin/super');
  revalidatePath('/internal/admin/users');
}

export async function revokeSuperAdminSessionsAction(
  userId: string,
  formData: FormData
) {
  void formData;

  await revokeSuperAdminAccountSessions({
    userId,
  });

  revalidatePath('/internal/admin/super');
}
