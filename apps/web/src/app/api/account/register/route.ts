import { getApiBaseUrl } from '@/lib/api-base-url';
import { NextResponse } from 'next/server';

type RegisterPayload = {
  email?: unknown;
  name?: unknown;
  password?: unknown;
};

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

export async function POST(request: Request) {
  let body: RegisterPayload;

  try {
    body = (await request.json()) as RegisterPayload;
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

  if (
    typeof body.email !== 'string' ||
    typeof body.name !== 'string' ||
    typeof body.password !== 'string'
  ) {
    return NextResponse.json(
      {
        message: 'Name, email, and password are required.',
      },
      {
        status: 400,
      },
    );
  }

  const email = body.email.trim().toLowerCase();
  const name = body.name.trim();
  const password = body.password;

  if (!email || !name || !password) {
    return NextResponse.json(
      {
        message: 'Name, email, and password are required.',
      },
      {
        status: 400,
      },
    );
  }

  if (password.length < 12) {
    return NextResponse.json(
      {
        message: 'Password must be at least 12 characters.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
      body: JSON.stringify({
        email,
        name,
        password,
      }),
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
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