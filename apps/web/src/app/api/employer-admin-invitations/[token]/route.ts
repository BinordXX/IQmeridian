import { NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/api-url';

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  const response = await fetch(
    `${getApiBaseUrl()}/auth/organisation-admin-invitations/${encodeURIComponent(
      token,
    )}`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  );

  const data = (await response.json().catch(() => ({}))) as unknown;

  return NextResponse.json(data, {
    status: response.status,
  });
}