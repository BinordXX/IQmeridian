'use client';

import type {
  AnalyticsExportDataset,
  InternalAnalyticsExportGovernanceSettingOutput,
  InternalAnalyticsExportRequestOutput,
} from '../_lib/internal-api';

type BrowserRequestOptions = {
  method: 'POST' | 'PATCH';
  body?: unknown;
};

type DirectAnalyticsExportFile = {
  fileName: string;
  contentType: string;
  content: string;
};

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (typeof record.message === 'string') {
      return record.message;
    }

    if (Array.isArray(record.message)) {
      const messages = record.message.filter(
        (entry): entry is string => typeof entry === 'string'
      );

      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    if (typeof record.error === 'string') {
      return record.error;
    }
  }

  return fallback;
}

async function browserInternalRequest<T>(
  path: string,
  options: BrowserRequestOptions
): Promise<T> {
  const response = await fetch(path, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'same-origin',
    cache: 'no-store',
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        payload,
        `Internal request failed with status ${response.status}.`
      )
    );
  }

  return payload as T;
}

export function requestAnalyticsExport(input: {
  dataset: AnalyticsExportDataset;
  format: string;
  dateFrom: string;
  dateTo: string;
  requestReason: string;
}) {
  return browserInternalRequest<InternalAnalyticsExportRequestOutput>(
    '/internal/api/exports/requests',
    {
      method: 'POST',
      body: input,
    }
  );
}

export function reviewAnalyticsExportRequest(
  requestId: string,
  input: {
    decision: 'APPROVED' | 'DECLINED';
    reviewReason: string | null;
  }
) {
  return browserInternalRequest<InternalAnalyticsExportRequestOutput>(
    `/internal/api/exports/requests/${encodeURIComponent(requestId)}/review`,
    {
      method: 'PATCH',
      body: input,
    }
  );
}

export function generateAnalyticsExportRequest(
  requestId: string,
  input: {
    generationReason: string | null;
  }
) {
  return browserInternalRequest<InternalAnalyticsExportRequestOutput>(
    `/internal/api/exports/requests/${encodeURIComponent(requestId)}/generate`,
    {
      method: 'POST',
      body: input,
    }
  );
}

export function updateAnalyticsExportGovernanceSetting(input: {
  approvalRequired: boolean;
}) {
  return browserInternalRequest<InternalAnalyticsExportGovernanceSettingOutput>(
    '/internal/api/exports/governance',
    {
      method: 'PATCH',
      body: input,
    }
  );
}

export function createDirectAnalyticsExport(input: {
  dataset: AnalyticsExportDataset;
  format: string;
  dateFrom: string;
  dateTo: string;
  directReason: string;
}) {
  return browserInternalRequest<DirectAnalyticsExportFile>(
    '/internal/api/exports/direct',
    {
      method: 'POST',
      body: input,
    }
  );
}
