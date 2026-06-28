import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';
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

export async function POST(request: Request) {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json(
      {
        message: 'Authentication is required.',
      },
      {
        status: 401,
      },
    );
  }

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
      },
    );
  }

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/contact-messages/authenticated`,
      {
        body: JSON.stringify(body),
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
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
      },
    );
  }
}