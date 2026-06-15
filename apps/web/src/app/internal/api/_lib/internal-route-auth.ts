import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function getInternalAuthorizationHeaders({
  includeJsonContentType = false,
}: {
  includeJsonContentType?: boolean;
} = {}) {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return {
      response: NextResponse.json(
        {
          message: 'Authentication is required for internal tooling.',
        },
        { status: 401 }
      ),
    } as const;
  }

  return {
    headers: {
      ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${accessToken}`,
    },
  } as const;
}
