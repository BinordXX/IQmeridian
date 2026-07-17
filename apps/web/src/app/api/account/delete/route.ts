import { parseRequestJson, proxyAccountApi } from '@/lib/account-api-proxy';

export async function POST(request: Request) {
  const parsedRequest = await parseRequestJson(request);

  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  return proxyAccountApi({
    body: parsedRequest.body,
    method: 'POST',
    path: '/account/delete',
  });
}
