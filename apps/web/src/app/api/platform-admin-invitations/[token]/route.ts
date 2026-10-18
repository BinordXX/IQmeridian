import { getApiBaseUrl } from '@/lib/api-base-url';
import { NextResponse } from 'next/server';

type RouteContext = {
  params:
    | {
        token: string;
      }
    | Promise<{
        token: string;
      }>;
};

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      message: text,
    };
  }
}

function normalisePayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.message)) {
    return {
      ...record,
      message: record.message
        .filter((entry): entry is string => typeof entry === 'string')
        .join(' '),
    };
  }

  return payload;
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await Promise.resolve(context.params);

  if (!token?.trim()) {
    return NextResponse.json(
      {
        message: 'Invitation token is required.',
      },
      {
        status: 400,
      },
    );
  }

  const response = await fetch(
    `${getApiBaseUrl()}/auth/platform-admin-invitations/${encodeURIComponent(
      token,
    )}`,
    {
      cache: 'no-store',
    },
  );

  const payload = normalisePayload(await readResponsePayload(response));

  return NextResponse.json(payload, {
    status: response.status,
  });
}