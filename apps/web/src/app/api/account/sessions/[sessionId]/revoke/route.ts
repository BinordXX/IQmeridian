import { proxyAccountApi } from '@/lib/account-api-proxy';

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;

  return proxyAccountApi({
    method: 'PATCH',
    path: `/account/sessions/${encodeURIComponent(sessionId)}/revoke`,
  });
}
