import { proxyAccountApi } from '@/lib/account-api-proxy';

export async function POST() {
  return proxyAccountApi({
    method: 'POST',
    path: '/account/sessions/revoke-others',
  });
}