import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-base-url';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await fetch(`${getApiBaseUrl()}/auth/register/candidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    return NextResponse.json(
      data ?? { message: 'Candidate registration failed.' },
      { status: response.status }
    );
  }

  const user =
    data && typeof data === 'object' && 'user' in data
      ? (data as { user: unknown }).user
      : null;

  return NextResponse.json({ user }, { status: 201 });
}
