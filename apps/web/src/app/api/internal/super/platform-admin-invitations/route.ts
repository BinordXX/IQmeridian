import { getApiBaseUrl } from '@/lib/api-base-url';
import { getServerApiAuthHeaders } from '@/lib/server-api-auth';
import { NextResponse } from 'next/server';

type PlatformAdminInvitationPayload = {
  name?: unknown;
  email?: unknown;
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

function normaliseApiPayload(payload: unknown) {
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

export async function POST(request: Request) {
  const authHeaders = await getServerApiAuthHeaders();

  if (!authHeaders) {
    return NextResponse.json(
      {
        message: 'Authentication is required.',
      },
      {
        status: 401,
      },
    );
  }

  let body: PlatformAdminInvitationPayload;

  try {
    body = (await request.json()) as PlatformAdminInvitationPayload;
  } catch {
    return NextResponse.json(
      {
        message: 'Invalid request body.',
      },
      {
        status: 400,
      },
    );
  }

  if (typeof body.name !== 'string' || typeof body.email !== 'string') {
    return NextResponse.json(
      {
        message: 'Name and email are required.',
      },
      {
        status: 400,
      },
    );
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();

  if (!name || !email) {
    return NextResponse.json(
      {
        message: 'Name and email are required.',
      },
      {
        status: 400,
      },
    );
  }

  const response = await fetch(
    `${getApiBaseUrl()}/auth/platform-admin-invitations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        name,
        email,
      }),
      cache: 'no-store',
    },
  );

  const payload = normaliseApiPayload(await readResponsePayload(response));

  return NextResponse.json(payload, {
    status: response.status,
  });
}