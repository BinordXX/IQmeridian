'use server';

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createAssignmentItem,
  submitAssignmentItem,
} from '../_lib/researcher-authoring-api';

const detailPath = (assignmentId: string) =>
  `/internal/researcher/assignments/${encodeURIComponent(assignmentId)}`;

const fail = (assignmentId: string, reason: string): never => {
  redirect(`${detailPath(assignmentId)}?error=${encodeURIComponent(reason)}`);
};

const allowedImageTypes: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const maxImageBytes = 5 * 1024 * 1024;

const optionalString = (value: FormDataEntryValue | null) => {
  const trimmedValue = String(value ?? '').trim();

  return trimmedValue || null;
};

const isUploadedFile = (value: FormDataEntryValue | null): value is File => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    'name' in value &&
    'size' in value &&
    Number(value.size) > 0
  );
};

const uploadAssessmentImage = async (
  value: FormDataEntryValue | null
): Promise<string | null> => {
  if (!isUploadedFile(value)) {
    return null;
  }

  if (value.size > maxImageBytes) {
    throw new Error('image-too-large');
  }

  const extension = allowedImageTypes[value.type];

  if (!extension) {
    throw new Error('unsupported-image-type');
  }

  const uploadDirectory = path.join(
    process.cwd(),
    'public',
    'uploads',
    'assessment-items'
  );

  await mkdir(uploadDirectory, { recursive: true });

  const fileName = `${randomUUID()}${extension}`;
  const destination = path.join(uploadDirectory, fileName);
  const bytes = Buffer.from(await value.arrayBuffer());

  await writeFile(destination, bytes);

  return `/uploads/assessment-items/${fileName}`;
};

const parseOptionalNumber = (value: FormDataEntryValue | null) => {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error('invalid-number');
  }

  return Math.trunc(parsedValue);
};

const buildDistractorRationale = (formData: FormData) => {
  const rationaleByOption = {
    A: optionalString(formData.get('rationaleA')),
    B: optionalString(formData.get('rationaleB')),
    C: optionalString(formData.get('rationaleC')),
    D: optionalString(formData.get('rationaleD')),
  };

  const entries = Object.entries(rationaleByOption).filter(([, value]) =>
    Boolean(value)
  );

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
};

const buildOptions = async (formData: FormData) => {
  const optionIds = ['A', 'B', 'C', 'D'];

  const options = await Promise.all(
    optionIds.map(async (optionId) => {
      const text = optionalString(formData.get(`optionText${optionId}`));
      const imageUrl = await uploadAssessmentImage(
        formData.get(`optionImage${optionId}`)
      );
      const altText = optionalString(formData.get(`optionImageAlt${optionId}`));

      if (!text && !imageUrl) {
        return null;
      }

      return {
        optionId,
        label: optionId,
        text: text ?? '',
        imageUrl: imageUrl ?? undefined,
        imageAltText: altText ?? undefined,
      };
    })
  );

  return options.filter(Boolean);
};

const buildStimulus = async (formData: FormData) => {
  const stimulusText = optionalString(formData.get('stimulusText'));
  const stimulusImageUrl = await uploadAssessmentImage(
    formData.get('stimulusImage')
  );
  const stimulusImageAlt = optionalString(formData.get('stimulusImageAlt'));

  if (stimulusImageUrl) {
    return {
      kind: 'image',
      content: stimulusImageUrl,
      altText: stimulusImageAlt ?? 'Assessment stimulus',
    };
  }

  if (stimulusText) {
    return {
      kind: 'text',
      content: stimulusText,
    };
  }

  return undefined;
};

export async function createAssignmentItemAction(
  assignmentId: string,
  formData: FormData
) {
  const prompt = String(formData.get('prompt') ?? '').trim();
  const itemType = String(formData.get('itemType') ?? '').trim();
  const scoringRule = String(formData.get('scoringRule') ?? '').trim();
  const difficulty = String(formData.get('difficulty') ?? '').trim();
  const intendedDifficulty = String(
    formData.get('intendedDifficulty') ?? ''
  ).trim();
  const cognitiveProcess = String(
    formData.get('cognitiveProcess') ?? ''
  ).trim();
  const itemRationale = String(formData.get('itemRationale') ?? '').trim();
  const correctOptionId = String(formData.get('correctOptionId') ?? '').trim();
  const submitAfterCreate = formData.get('submitAfterCreate') === 'on';

  if (!prompt) {
    fail(assignmentId, 'prompt-required');
  }

  if (!itemType) {
    fail(assignmentId, 'item-type-required');
  }

  if (!correctOptionId) {
    fail(assignmentId, 'correct-option-required');
  }

  let stimulus: unknown;
  let options: unknown;
  let estimatedResponseTimeSec: number | null = null;

  try {
    stimulus = await buildStimulus(formData);
    options = await buildOptions(formData);
    estimatedResponseTimeSec = parseOptionalNumber(
      formData.get('estimatedResponseTimeSec')
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid-input';

    fail(assignmentId, message);
  }

  if (!Array.isArray(options) || options.length < 2) {
    fail(assignmentId, 'options-required');
  }

  let itemId: string | null = null;

  try {
    const item = await createAssignmentItem(assignmentId, {
      prompt,
      stimulus,
      itemType,
      options,
      correctAnswer: {
        optionId: correctOptionId,
      },
      scoringRule: scoringRule || 'BINARY_CORRECT',
      difficulty: difficulty || null,
      intendedDifficulty: intendedDifficulty || null,
      estimatedResponseTimeSec,
      cognitiveProcess: cognitiveProcess || null,
      itemRationale: itemRationale || null,
      distractorRationale: buildDistractorRationale(formData),
    });

    itemId = item.id;

    if (submitAfterCreate) {
      await submitAssignmentItem(assignmentId, item.id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'create-failed';

    console.error('Create assignment item failed:', message);

    fail(assignmentId, message.slice(0, 180));
  }

  revalidatePath(detailPath(assignmentId));

  redirect(
    `${detailPath(assignmentId)}?updated=${
      submitAfterCreate ? 'created-submitted' : 'created'
    }&itemId=${encodeURIComponent(itemId ?? '')}`
  );
}

export async function submitAssignmentItemAction(
  assignmentId: string,
  itemId: string
) {
  try {
    await submitAssignmentItem(assignmentId, itemId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'submit-failed';

    console.error('Submit assignment item failed:', message);

    fail(assignmentId, message.slice(0, 180));
  }

  revalidatePath(detailPath(assignmentId));

  redirect(`${detailPath(assignmentId)}?updated=submitted`);
}
