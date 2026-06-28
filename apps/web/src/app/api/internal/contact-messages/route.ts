import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { getSessionRole } from '@/lib/post-login-redirect';
import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
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
      },
    );
  }

  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(`${getApiBaseUrl()}/contact-messages/admin`);

  for (const [key, value] of requestUrl.searchParams.entries()) {
    upstreamUrl.searchParams.set(key, value);
  }

  try {
    const response = await fetch(upstreamUrl, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

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
      },
    );
  }
}