import { getInternalAuthorizationHeaders } from '@/app/internal/api/_lib/internal-route-auth';
import { NextResponse } from 'next/server';

function getInternalApiBaseUrl() {
  return process.env.INTERNAL_API_BASE_URL ?? 'http://localhost:3001';
}

function parseJsonSafely(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await context.params;
    const body = (await request.json()) as unknown;

    const authContext = await getInternalAuthorizationHeaders({
      includeJsonContentType: true,
    });

    if ('response' in authContext) {
      return authContext.response;
    }

    const authHeaders = authContext.headers;

    const response = await fetch(
      `${getInternalApiBaseUrl()}/internal/exports/requests/${encodeURIComponent(
        requestId
      )}/review`,
      {
        method: 'PATCH',
        cache: 'no-store',
        headers: authHeaders,
        body: JSON.stringify(body),
      }
    );

    const responseText = await response.text();
    const parsedBody = parseJsonSafely(responseText);

    if (!response.ok) {
      return NextResponse.json(
        parsedBody ?? {
          message:
            responseText.length > 0
              ? responseText
              : 'Analytics export request could not be reviewed.',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(parsedBody, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Analytics export review proxy failed.',
      },
      { status: 500 }
    );
  }
}
