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
    <main className="min-h-screen bg-[#020817] px-6 py-12 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-lg items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/95 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.12),transparent_30%)]" />

          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Session control
            </p>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
              Sign out
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              This will revoke your active API session and sign you out of
              IQMeridian.
            </p>

            <form action={logout} className="mt-7">
              <button
                type="submit"
                className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
