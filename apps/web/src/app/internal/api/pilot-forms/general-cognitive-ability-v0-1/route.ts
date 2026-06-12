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

export async function POST() {
  try {
    const response = await fetch(
      `${getInternalApiBaseUrl()}/internal/pilot-forms/general-cognitive-ability-v0-1`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-role': 'RESEARCHER',
        },
        body: JSON.stringify({}),
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
              : 'Formal pilot form could not be created.',
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
            : 'Formal pilot-form proxy failed.',
      },
      { status: 500 }
    );
  }
}