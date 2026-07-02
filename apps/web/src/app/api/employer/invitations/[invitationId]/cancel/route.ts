import { proxyEmployerApi } from '@/lib/employer-api-proxy';

type RouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const { invitationId } = await context.params;

  return proxyEmployerApi({
    method: 'PATCH',
    path: `/invitations/${encodeURIComponent(invitationId)}/cancel`,
  });
}