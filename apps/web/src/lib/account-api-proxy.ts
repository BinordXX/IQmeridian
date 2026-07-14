import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { NextResponse } from 'next/server';

type ProxyAccountApiInput = {
  path: string;
  method: 'GET' | 'PATCH' | 'POST';
  body?: unknown;
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

export async function parseRequestJson(request: Request) {
  try {
    return {
      ok: true as const,
      body: (await request.json()) as unknown,
    };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message: 'Invalid request body.',
        },
        {
          status: 400,
        }
      ),
    };
  }
}

export async function proxyAccountApi(input: ProxyAccountApiInput) {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json(
      {
        message: 'Authentication is required.',
      },
      {
        status: 401,
      }
    );
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}${input.path}`, {
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(input.body === undefined
          ? {}
          : {
              'Content-Type': 'application/json',
            }),
      },
      method: input.method,
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
      }
    );
  }
}
