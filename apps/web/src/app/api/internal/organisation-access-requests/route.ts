import { NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/api-url';
import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

export async function GET(request: Request) {
  try {
    const authHeaders = await getRequiredServerApiAuthHeaders();
    const requestUrl = new URL(request.url);
    const status = requestUrl.searchParams.get('status');

    const apiUrl = new URL(`${getApiBaseUrl()}/organisation-access-requests`);

    if (status) {
      apiUrl.searchParams.set('status', status);
    }

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: authHeaders,
      cache: 'no-store',
    });

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
            : 'Authentication is required.',
      },
      {
        status: 401,
      }
    );
  }
}
