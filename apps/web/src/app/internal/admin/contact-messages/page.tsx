import { auth } from '@/auth';
import {
  getPostLoginRedirectPath,
  getSessionRole,
} from '@/lib/post-login-redirect';
import { redirect } from 'next/navigation';
import { ContactMessageInbox } from './_components/contact-message-inbox';

export const metadata = {
  title: 'Contact Messages | IQMeridian Admin',
  description: 'Platform admin contact-message inbox.',
};

export default async function AdminContactMessagesPage() {
  const session = await auth();
  const role = getSessionRole(session);

  if (!session?.user) {
    redirect('/login?callbackUrl=/internal/admin/contact-messages');
  }

  if (role !== 'PLATFORM_ADMIN') {
    redirect(getPostLoginRedirectPath(role));
  }

  return <ContactMessageInbox />;
}