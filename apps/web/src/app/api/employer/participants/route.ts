import { proxyEmployerApi } from '@/lib/employer-api-proxy';

export async function GET() {
  return proxyEmployerApi({
    method: 'GET',
    path: '/organisation-participants',
  });
}
