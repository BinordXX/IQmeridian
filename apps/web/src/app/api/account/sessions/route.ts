import { proxyAccountApi } from '@/lib/account-api-proxy';

export async function GET() {
  return proxyAccountApi({
    method: 'GET',
    path: '/account/sessions',
  });
}