import { getServerApiAuthHeaders } from '@/lib/server-api-auth';
import { NextResponse } from 'next/server';

export async function getInternalAuthorizationHeaders({
  includeJsonContentType = false,
}: {
  includeJsonContentType?: boolean;
} = {}) {
  const authHeaders = await getServerApiAuthHeaders();

  if (!authHeaders) {
    return {
      response: NextResponse.json(
        {
          message: 'Authentication is required for internal tooling.',
        },
        { status: 401 }
      ),
    } as const;
  }

  return {
    headers: {
      ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders,
    },
  } as const;
}
