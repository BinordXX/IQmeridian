'use server';

import { redirect } from 'next/navigation';

import { createConsumerAssessmentSession } from './consumer-dashboard-api';

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
