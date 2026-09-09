'use server';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { updateMyLeaderboardPreferences } from './consumer-dashboard-api';
import { updateMyPublicProfile } from './consumer-dashboard-api';
import { createConsumerAssessmentSession } from './consumer-dashboard-api';

const savePublicProfileAvatar = async ({
  avatarFile,
  profileSlug,
}: {
  avatarFile: FormDataEntryValue | null;
  profileSlug: string;
}) => {
  if (!(avatarFile instanceof File) || avatarFile.size === 0) {
    return null;
  }

  const allowedTypes = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ]);

  const extension = allowedTypes.get(avatarFile.type);

  if (!extension) {
    throw new Error('Profile image must be a JPG, PNG, or WEBP file.');
  }

  if (avatarFile.size > 2 * 1024 * 1024) {
    throw new Error('Profile image must be 2MB or smaller.');
  }

  const uploadDirectory = path.join(
    process.cwd(),
    'public',
    'uploads',
    'leaderboard-profiles'
  );

  await mkdir(uploadDirectory, { recursive: true });

  const fileName = `${profileSlug || 'profile'}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDirectory, fileName);

  await writeFile(filePath, Buffer.from(await avatarFile.arrayBuffer()));

  return `/uploads/leaderboard-profiles/${fileName}`;
};

const toPublicProfileSlug = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export async function startConsumerAssessmentAction() {
  let sessionId: string;

  try {
    const created = await createConsumerAssessmentSession();
    sessionId = created.sessionId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to start assessment.';

    redirect(
      `/dashboard?startError=${encodeURIComponent(message.slice(0, 180))}`
    );
  }

  redirect(`/assessment/session/${sessionId}/instructions`);
}

export async function updatePublicProfileAction(formData: FormData) {
  const publicProfileEnabled =
    String(formData.get('publicProfileEnabled') ?? '') === 'true';

  const profileSlug = String(formData.get('profileSlug') ?? '').trim();
  const displayName = String(formData.get('displayName') ?? '').trim();
  const headline = String(formData.get('headline') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();
  const quote = String(formData.get('quote') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();
  const existingAvatarUrl = String(
    formData.get('existingAvatarUrl') ?? ''
  ).trim();
  const websiteUrl = String(formData.get('websiteUrl') ?? '').trim();

  let updatedProfile;

  try {
    const uploadedAvatarUrl = await savePublicProfileAvatar({
      avatarFile: formData.get('avatarFile'),
      profileSlug: profileSlug || displayName || 'profile',
    });

    updatedProfile = await updateMyPublicProfile({
      publicProfileEnabled,
      profileSlug: profileSlug || null,
      displayName: displayName || null,
      headline: headline || null,
      bio: bio || null,
      quote: quote || null,
      location: location || null,
      avatarUrl: uploadedAvatarUrl ?? (existingAvatarUrl || null),
      websiteUrl: websiteUrl || null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Public profile could not be saved.';

    redirect(
      `/dashboard/settings/public-profile?error=${encodeURIComponent(message)}`
    );
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/settings/public-profile');
  revalidatePath('/leaderboard');

  if (updatedProfile.profile.publicProfileUrl) {
    revalidatePath(updatedProfile.profile.publicProfileUrl);
  }

  if (
    updatedProfile.leaderboard.publicProfileVisible &&
    updatedProfile.profile.publicProfileUrl
  ) {
    redirect(updatedProfile.profile.publicProfileUrl);
  }

  redirect('/dashboard/settings/public-profile?saved=1');
}

export async function updateLeaderboardPreferencesAction(formData: FormData) {
  const optIn = String(formData.get('optIn') ?? '') === 'true';
  const displayName = String(formData.get('displayName') ?? '').trim();

  await updateMyLeaderboardPreferences({
    optIn,
    displayName: displayName || null,
  });

  revalidatePath('/dashboard');
  revalidatePath('/leaderboard');
}
