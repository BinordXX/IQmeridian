import { NextRequest, NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/api-base-url';

function normaliseApiPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const payloadRecord = payload as Record<string, unknown>;
  const message = payloadRecord.message;

  if (Array.isArray(message)) {
    return {
      ...payloadRecord,
      message: message.filter((item) => typeof item === 'string').join(' '),
    };
  }

  return payload;
}

async function parseApiResponse(response: Response) {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return {};
  }

  try {
    return normaliseApiPayload(JSON.parse(responseText) as unknown);
  } catch {
    return {
      message: responseText,
    };
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      {
        message: 'Invalid request body.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const payload = await parseApiResponse(response);

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message: 'Unable to reach the IQMeridian API service.',
      },
      {
        status: 502,
      },
    );
  }
}