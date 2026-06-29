import {
  parseRequestJson,
  proxyAccountApi,
} from '@/lib/account-api-proxy';

export async function GET() {
  return proxyAccountApi({
    method: 'GET',
    path: '/account/profile',
  });
}

export async function PATCH(request: Request) {
  const parsedRequest = await parseRequestJson(request);

  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  return proxyAccountApi({
    body: parsedRequest.body,
    method: 'PATCH',
    path: '/account/profile',
  });
}