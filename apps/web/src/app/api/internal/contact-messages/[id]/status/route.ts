import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { getSessionRole } from '@/lib/post-login-redirect';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function parseApiResponse(response: Response) {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return {};
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return {
      message: responseText,
    };
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  const accessToken = session?.accessToken;
  const role = getSessionRole(session);

  if (!accessToken || role !== 'PLATFORM_ADMIN') {
    return NextResponse.json(
      {
        message: 'Platform administrator access is required.',
      },
      {
        status: 403,
      }
    );
  }

  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: 'Invalid request body.',
      },
      {
        status: 400,
      }
    );
  }

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/contact-messages/admin/${id}/status`,
      {
        body: JSON.stringify(body),
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      }
    );

    const payload = await parseApiResponse(response);

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message: 'Unable to reach the IQMeridian API service.',
      },
      {
        status: 502,
      }
    );
  }
}
