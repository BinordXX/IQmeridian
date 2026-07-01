import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';
import { NextResponse } from 'next/server';

const normaliseBaseUrl = (baseUrl: string) => {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const getApiBaseUrl = () => {
  return normaliseBaseUrl(
    process.env.API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001',
  );
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

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Invalid invitation request body.' },
      { status: 400 },
    );
  }

  try {
    const authHeaders = await getRequiredServerApiAuthHeaders();

    const response = await fetch(`${getApiBaseUrl()}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(body),
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
}