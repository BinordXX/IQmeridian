import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Globe2 } from 'lucide-react';

import { auth } from '@/auth';
import { AccountSettingsClient } from './_components/account-settings-client';

export default async function DashboardSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/settings');
  }

  return (
    <main className="space-y-6">
      <Link
        className="block rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] transition hover:border-cyan-300/30 hover:bg-[#0b1c3f]"
        href="/dashboard/settings/public-profile"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
          <Globe2 size={22} strokeWidth={2} />
        </span>

        <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
          Public profile
        </p>

        <h2 className="mt-2 text-xl font-black text-white">
          Edit leaderboard profile
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Manage the display name, bio, avatar, quote, location, and public link
          shown from the leaderboard.
        </p>
      </Link>

      <AccountSettingsClient
        initialUser={{
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        }}
        sessionExpires={session.expires}
      />
    </main>
  );
}
