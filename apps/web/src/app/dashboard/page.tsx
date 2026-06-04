import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { SignOutButton } from './signout-button';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/signin');
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>IQMeridian Dashboard</h1>
      <p>Authenticated as: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <SignOutButton />
    </main>
  );
}
