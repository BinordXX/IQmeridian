import { auth } from '@/auth';
import {
  getPostLoginRedirectPath,
  getSessionRole,
} from '@/lib/post-login-redirect';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Redirecting | IQMeridian',
};

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const role = getSessionRole(session);

  redirect(getPostLoginRedirectPath(role));
}
