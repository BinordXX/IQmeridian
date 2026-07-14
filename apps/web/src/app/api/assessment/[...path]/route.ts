import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { getServerApiAuthHeaders } from '@/lib/server-api-auth';

type AssessmentProxyContext = {
  params:
    | {
        path?: string[];
      }
    | Promise<{
        path?: string[];
      }>;
};

const PUBLIC_BACKEND_PATH_PREFIXES = [
  '/invitations/validate/',
  '/sessions/invitation',
  '/sessions/public/',
  '/responses/public/',
];

function normaliseBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

async function resolveBackendPath(context: AssessmentProxyContext) {
  const params = await Promise.resolve(context.params);
  const path = params.path ?? [];

  return `/${path.map((segment) => encodeURIComponent(segment)).join('/')}`;
}

function isPublicAssessmentPath(path: string) {
  return PUBLIC_BACKEND_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

async function proxyAssessmentRequest(
  request: NextRequest,
  context: AssessmentProxyContext
) {
  const backendPath = await resolveBackendPath(context);
  const isPublicPath = isPublicAssessmentPath(backendPath);

  const authHeaders = isPublicPath ? null : await getServerApiAuthHeaders();

  if (!isPublicPath && !authHeaders) {
    return NextResponse.json(
      { message: 'Authentication is required.' },
      { status: 401 }
    );
  }

  const requestBody =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.text();

  const backendResponse = await fetch(
    `${normaliseBaseUrl(getApiBaseUrl())}${backendPath}${request.nextUrl.search}`,
    {
      method: request.method,
      headers: {
        ...(requestBody ? { 'Content-Type': 'application/json' } : {}),
        ...(isPublicPath && request.headers.get('x-assessment-session-token')
          ? {
              'X-Assessment-Session-Token':
                request.headers.get('x-assessment-session-token') ?? '',
            }
          : {}),
        ...(authHeaders ?? {}),
      },
      body: requestBody,
      cache: 'no-store',
    }
  );

  const responseBody = await backendResponse.text();
  const contentType =
    backendResponse.headers.get('content-type') ?? 'application/json';

  return new NextResponse(responseBody || null, {
    status: backendResponse.status,
    headers: {
      'Content-Type': contentType,
    },
  });
}

export async function GET(
  request: NextRequest,
  context: AssessmentProxyContext
) {
  return proxyAssessmentRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: AssessmentProxyContext
) {
  return proxyAssessmentRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: AssessmentProxyContext
) {
  return proxyAssessmentRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: AssessmentProxyContext
) {
  return proxyAssessmentRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: AssessmentProxyContext
) {
  return proxyAssessmentRequest(request, context);
}
