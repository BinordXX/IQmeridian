import { NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/api-url';
import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const authHeaders = await getRequiredServerApiAuthHeaders();
    const { requestId } = await context.params;

    const response = await fetch(
      `${getApiBaseUrl()}/organisation-access-requests/${encodeURIComponent(
        requestId,
      )}/convert`,
      {
        method: 'POST',
        headers: authHeaders,
        cache: 'no-store',
      },
    );

    const data = (await response.json().catch(() => ({}))) as unknown;

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Unable to convert organisation access request.',
      },
      {
        status: 401,
      },
    );
  }
}