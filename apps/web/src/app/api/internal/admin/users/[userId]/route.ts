import { getApiBaseUrl } from '@/lib/api-base-url';
import { getServerApiAuthHeaders } from '@/lib/server-api-auth';
import { NextResponse } from 'next/server';

type RouteContext = {
  params:
    | {
        userId: string;
      }
    | Promise<{
        userId: string;
      }>;
};

type PermanentDeletePayload = {
  confirmationEmail?: unknown;
};

async function readPayload(response: Response): Promise<unknown> {
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

export async function DELETE(request: Request, context: RouteContext) {
  const authHeaders = await getServerApiAuthHeaders();

  if (!authHeaders) {
    return NextResponse.json(
      {
        message: 'Authentication is required.',
      },
      {
        status: 401,
      }
    );
  }

  const { userId } = await Promise.resolve(context.params);

  if (!userId?.trim()) {
    return NextResponse.json(
      {
        message: 'User ID is required.',
      },
      {
        status: 400,
      }
    );
  }

  let body: PermanentDeletePayload;

  try {
    body = (await request.json()) as PermanentDeletePayload;
  } catch {
    return NextResponse.json(
      {
        message: 'Deletion confirmation is required.',
      },
      {
        status: 400,
      }
    );
  }

  if (
    typeof body.confirmationEmail !== 'string' ||
    !body.confirmationEmail.trim()
  ) {
    return NextResponse.json(
      {
        message: 'Confirmation email is required.',
      },
      {
        status: 400,
      }
    );
  }

  const response = await fetch(
    `${getApiBaseUrl()}/users/${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        confirmationEmail: body.confirmationEmail.trim().toLowerCase(),
      }),
      cache: 'no-store',
    }
  );

  const payload = normalisePayload(await readPayload(response));

  return NextResponse.json(payload, {
    status: response.status,
  });
}
