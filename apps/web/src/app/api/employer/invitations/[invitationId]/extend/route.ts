import {
  parseEmployerRequestJson,
  proxyEmployerApi,
} from '@/lib/employer-api-proxy';

type RouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { invitationId } = await context.params;
  const parsedRequest = await parseEmployerRequestJson(request);

  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  return proxyEmployerApi({
    method: 'PATCH',
    path: `/invitations/${encodeURIComponent(invitationId)}/extend`,
    body: parsedRequest.body,
  });
}
