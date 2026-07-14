import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AccountSettingsClient } from './_components/account-settings-client';

export default async function DashboardSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/settings');
  }

  return (
    <AccountSettingsClient
      initialUser={{
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      }}
      sessionExpires={session.expires}
    />
  );
}
