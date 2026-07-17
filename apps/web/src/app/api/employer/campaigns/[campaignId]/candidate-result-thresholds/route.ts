import { NextResponse } from 'next/server';

import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

type RouteContext = {
  params: Promise<{
    campaignId: string;
  }>;
};

const normaliseBaseUrl = (baseUrl: string): string => {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const getApiBaseUrl = (): string => {
  return normaliseBaseUrl(
    process.env.API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001',
  );
};

export async function PATCH(request: Request, context: RouteContext) {
  const { campaignId } = await context.params;
  const body = (await request.json()) as unknown;
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const response = await fetch(
    `${getApiBaseUrl()}/campaigns/${encodeURIComponent(
      campaignId,
    )}/candidate-result-thresholds`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  );

  const responseText = await response.text();

  if (!response.ok) {
    return new NextResponse(responseText || response.statusText, {
      status: response.status,
    });
  }

  return new NextResponse(responseText || '{}', {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}