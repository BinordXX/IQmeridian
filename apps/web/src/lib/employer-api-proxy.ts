import { getApiBaseUrl } from '@/lib/api-base-url';
import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';
import { NextResponse } from 'next/server';

type ProxyEmployerApiInput = {
  path: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

const parseApiPayload = async (response: Response) => {
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
};

export const parseEmployerRequestJson = async (request: Request) => {
  try {
    return {
      ok: true as const,
      body: (await request.json()) as unknown,
    };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Invalid request body.' },
        { status: 400 },
      ),
    };
  }
};

export const proxyEmployerApi = async (input: ProxyEmployerApiInput) => {
  try {
    const authHeaders = await getRequiredServerApiAuthHeaders();

    const response = await fetch(`${getApiBaseUrl()}${input.path}`, {
      method: input.method,
      headers: {
        ...(input.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...authHeaders,
      },
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
      cache: 'no-store',
    });

    const payload = await parseApiPayload(response);

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Unable to reach the IQMeridian API service.' },
      { status: 502 },
    );
  }
};