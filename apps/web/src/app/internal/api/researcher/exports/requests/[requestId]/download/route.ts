import { getInternalAuthorizationHeaders } from '@/app/internal/api/_lib/internal-route-auth';
import { NextResponse } from 'next/server';

type InternalAnalyticsExportFileOutput = {
  fileName: string;
  contentType: string;
  content: string;
};

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await context.params;

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
      )}/download`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: authHeaders,
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
              : 'Analytics export could not be downloaded.',
        },
        { status: response.status }
      );
    }

    const file = parsedBody as InternalAnalyticsExportFileOutput;

    return new Response(file.content, {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Researcher export download proxy failed.',
      },
      { status: 500 }
    );
  }
}
