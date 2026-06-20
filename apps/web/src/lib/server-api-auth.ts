import { auth } from '@/auth';

export async function getServerApiAuthHeaders() {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return null;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getRequiredServerApiAuthHeaders() {
  const headers = await getServerApiAuthHeaders();

  if (!headers) {
    throw new Error('Authentication is required.');
  }

  return headers;
}
