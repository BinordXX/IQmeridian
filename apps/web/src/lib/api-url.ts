export const getApiBaseUrl = () => {
  const apiBaseUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:3001';

  return apiBaseUrl.replace(/\/$/, '');
};