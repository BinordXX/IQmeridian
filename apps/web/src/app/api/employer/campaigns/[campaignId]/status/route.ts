import {
  parseEmployerRequestJson,
  proxyEmployerApi,
} from '@/lib/employer-api-proxy';

type RouteContext = {
  params: Promise<{
    campaignId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { campaignId } = await context.params;
  const parsedRequest = await parseEmployerRequestJson(request);

  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  return proxyEmployerApi({
    method: 'PATCH',
    path: `/campaigns/${encodeURIComponent(campaignId)}/status`,
    body: parsedRequest.body,
  });
}
