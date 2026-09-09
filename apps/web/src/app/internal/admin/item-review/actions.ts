'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  approveItem,
  rejectItem,
  requestItemChanges,
  startItemReview,
} from './_lib/item-review-api';

const reviewQueuePath = '/internal/admin/item-review';

const fail = (reason: string): never => {
  redirect(`${reviewQueuePath}?error=${encodeURIComponent(reason)}`);
};

const optionalString = (value: FormDataEntryValue | null) => {
  const trimmedValue = String(value ?? '').trim();

  return trimmedValue || null;
};

const optionalInteger = (value: FormDataEntryValue | null) => {
  const trimmedValue = String(value ?? '').trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error('invalid-order-index');
  }

  return Math.trunc(parsedValue);
};

export async function startItemReviewAction(
  itemId: string,
  formData: FormData
) {
  try {
    await startItemReview(itemId, {
      reviewNotes: optionalString(formData.get('reviewNotes')),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'start-failed';

    console.error('Start item review failed:', message);

    fail(message.slice(0, 180));
  }

  revalidatePath(reviewQueuePath);
  redirect(`${reviewQueuePath}?updated=review-started`);
}

export async function requestItemChangesAction(
  itemId: string,
  formData: FormData
) {
  try {
    await requestItemChanges(itemId, {
      reviewNotes: optionalString(formData.get('reviewNotes')),
      reason: optionalString(formData.get('reason')),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'changes-failed';

    console.error('Request item changes failed:', message);

    fail(message.slice(0, 180));
  }

  revalidatePath(reviewQueuePath);
  redirect(`${reviewQueuePath}?updated=changes-requested`);
}

export async function rejectItemAction(itemId: string, formData: FormData) {
  try {
    await rejectItem(itemId, {
      reviewNotes: optionalString(formData.get('reviewNotes')),
      reason: optionalString(formData.get('reason')),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'reject-failed';

    console.error('Reject item failed:', message);

    fail(message.slice(0, 180));
  }

  revalidatePath(reviewQueuePath);
  redirect(`${reviewQueuePath}?updated=rejected`);
}

export async function approveItemAction(itemId: string, formData: FormData) {
  let orderIndex: number | null = null;

  try {
    orderIndex = optionalInteger(formData.get('orderIndex'));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'invalid-order-index';

    fail(message);
  }

  try {
    await approveItem(itemId, {
      reviewNotes: optionalString(formData.get('reviewNotes')),
      activate: formData.get('activate') === 'on',
      orderIndex,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'approve-failed';

    console.error('Approve item failed:', message);

    fail(message.slice(0, 180));
  }

  revalidatePath(reviewQueuePath);
  redirect(`${reviewQueuePath}?updated=approved`);
}
