import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { NextResponse } from 'next/server';

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
      }
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
      }
    );
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/change-password`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();

  let payload: unknown = {
    message: response.ok
      ? 'Password changed successfully.'
      : 'Password change failed.',
  };

  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      payload = {
        message: responseText,
      };
    }
  }

  return NextResponse.json(payload, {
    status: response.status,
  });
}