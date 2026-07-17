import {
  parseEmployerRequestJson,
  proxyEmployerApi,
} from '@/lib/employer-api-proxy';

export async function POST(request: Request) {
  const parsedRequest = await parseEmployerRequestJson(request);

  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  return proxyEmployerApi({
    method: 'POST',
    path: '/invitations',
    body: parsedRequest.body,
  });
}
