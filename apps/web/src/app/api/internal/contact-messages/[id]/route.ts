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

export async function GET(_request: Request, context: RouteContext) {
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

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/contact-messages/admin/${id}`,
      {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
