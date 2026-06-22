'use server';

import { redirect } from 'next/navigation';

import {
  createInternalUser,
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

const fail = (reason: string): never => {
  redirect(`/internal/admin/users/new?error=${encodeURIComponent(reason)}`);
};

export async function createInternalUserAction(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? '') as InternalUserRole;
  const status = String(
    formData.get('status') ?? 'ACTIVE'
  ) as InternalUserStatus;
  const organisationId = String(formData.get('organisationId') ?? '').trim();

  if (!email || !password || !validRoles.includes(role)) {
    fail('invalid-input');
  }

  if (!validStatuses.includes(status)) {
    fail('invalid-status');
  }

  if (password.length < 12) {
    fail('weak-password');
  }

  if (role === 'EMPLOYER_ADMIN' && !organisationId) {
    fail('organisation-required');
  }

  let createdUserId: string | null = null;

  try {
    const user = await createInternalUser({
      email,
      name: name || null,
      password,
      role,
      status,
      organisationId: organisationId || null,
    });

    createdUserId = user.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'create-failed';

    console.error('Create internal user failed:', message);

    fail(message.slice(0, 180));
  }

  if (!createdUserId) {
    fail('create-failed');
  }

  redirect(`/internal/admin/users/${createdUserId}?updated=created`);
}
