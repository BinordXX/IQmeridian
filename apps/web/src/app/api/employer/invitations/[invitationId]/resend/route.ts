import { proxyEmployerApi } from '@/lib/employer-api-proxy';

type RouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { invitationId } = await context.params;

  return proxyEmployerApi({
    method: 'POST',
    path: `/invitations/${encodeURIComponent(invitationId)}/resend`,
  });
}
