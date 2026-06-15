import { auth, signOut } from '@/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';

async function logout() {
  'use server';

  const session = await auth();

  if (session?.accessToken) {
    await fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ allSessions: false }),
      cache: 'no-store',
    }).catch(() => null);
  }

  await signOut({ redirectTo: '/login' });
}

export default function LogoutPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Sign out</h1>
        <p className="mt-2 text-sm text-slate-600">
          This will revoke your active API session and sign you out of
          IQMeridian.
        </p>

        <form action={logout} className="mt-6">
          <button
            type="submit"
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
