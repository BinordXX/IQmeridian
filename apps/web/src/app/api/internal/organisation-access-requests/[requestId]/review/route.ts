import { NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/api-url';
import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authHeaders = await getRequiredServerApiAuthHeaders();
  const { requestId } = await context.params;
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json(
      {
        message: 'Invalid organisation access request review payload.',
      },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${getApiBaseUrl()}/organisation-access-requests/${encodeURIComponent(
      requestId,
    )}/review`,
    {
      method: 'PATCH',
      headers: {
        ...authHeaders,
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