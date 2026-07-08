import { NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/api-url';

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json(
      {
        message: 'Invalid employer-admin invitation acceptance payload.',
      },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${getApiBaseUrl()}/auth/organisation-admin-invitations/${encodeURIComponent(
      token,
    )}/accept`,
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