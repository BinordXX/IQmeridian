import {
  parseEmployerRequestJson,
  proxyEmployerApi,
} from '@/lib/employer-api-proxy';

type RouteContext = {
  params: Promise<{
    participantId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { participantId } = await context.params;
  const parsedRequest = await parseEmployerRequestJson(request);

  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  return proxyEmployerApi({
    method: 'PATCH',
    path: `/organisation-participants/${encodeURIComponent(participantId)}/status`,
    body: parsedRequest.body,
  });
}