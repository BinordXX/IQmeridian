'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';

const getAccessToken = async () => {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    throw new Error('Missing access token.');
  }

  return accessToken;
};

export async function setConsumerDefaultAssessmentAction(formData: FormData) {
  const assessmentFormId = String(formData.get('assessmentFormId') ?? '');

  if (!assessmentFormId) {
    redirect('/internal/admin/consumer-assessment?error=missing-form');
  }

  const accessToken = await getAccessToken();

  const response = await fetch(
    `${getApiBaseUrl()}/internal/consumer-assessment/default`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        assessmentFormId,
      }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    redirect('/internal/admin/consumer-assessment?error=update-failed');
  }

  revalidatePath('/internal/admin/consumer-assessment');
  revalidatePath('/dashboard');

  redirect('/internal/admin/consumer-assessment?updated=true');
}
