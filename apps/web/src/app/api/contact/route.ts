import { getApiBaseUrl } from '@/lib/api-base-url';
import { NextResponse } from 'next/server';

type ContactPayload = {
  email?: unknown;
  enquiryType?: unknown;
  fullName?: unknown;
  message?: unknown;
  organisation?: unknown;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const message = record.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === 'string').join(' ');
  }

  return fallback;
}

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
  let body: ContactPayload;

  try {
    body = (await request.json()) as ContactPayload;
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

  if (
    typeof body.fullName !== 'string' ||
    typeof body.email !== 'string' ||
    typeof body.enquiryType !== 'string' ||
    typeof body.message !== 'string'
  ) {
    return NextResponse.json(
      {
        message: 'Full name, email, enquiry type, and message are required.',
      },
      {
        status: 400,
      },
    );
  }

  const fullName = body.fullName.trim();
  const email = body.email.trim().toLowerCase();
  const enquiryType = body.enquiryType;
  const message = body.message.trim();
  const organisation =
    typeof body.organisation === 'string'
      ? body.organisation.trim()
      : undefined;

  if (!fullName || !email || !enquiryType || !message) {
    return NextResponse.json(
      {
        message: 'Full name, email, enquiry type, and message are required.',
      },
      {
        status: 400,
      },
    );
  }

  if (message.length < 20) {
    return NextResponse.json(
      {
        message: 'Message must be at least 20 characters.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/contact-messages`, {
      body: JSON.stringify({
        email,
        enquiryType,
        fullName,
        message,
        organisation: organisation || undefined,
      }),
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    const payload = await parseApiResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          message: getErrorMessage(payload, 'Contact message failed.'),
        },
        {
          status: response.status,
        },
      );
    }

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