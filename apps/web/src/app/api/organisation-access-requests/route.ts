import { NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/api-url';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json(
      {
        message: 'Invalid organisation access request payload.',
      },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${getApiBaseUrl()}/organisation-access-requests`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    },
  );

  const data = (await response.json().catch(() => ({}))) as unknown;

  return NextResponse.json(data, {
    status: response.status,
  });
}