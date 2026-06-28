import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PublicAuthShell } from '../_components/public-auth-shell';
import { LoginForm } from './_components/login-form';

export const metadata = {
  title: 'Sign in | IQMeridian',
  description: 'Sign in to your IQMeridian account.',
};

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

function getSafeCallbackUrl(callbackUrl?: string) {
  if (!callbackUrl) {
    return '/dashboard';
  }

  if (!callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return '/dashboard';
  }

  return callbackUrl;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params?.callbackUrl);

  return (
    <PublicAuthShell
      description="Access your dashboard, assessment workspace, profile history, and role-specific IQMeridian tools."
      eyebrow="Secure access"
      proofPoints={[
        'Role-aware access for consumers, candidates, employers, researchers, and platform administrators.',
        'Authenticated sessions connect directly to IQMeridian dashboards.',
        'Internal workflows remain separated from public and candidate-facing routes.',
      ]}
      sideDescription="Authentication is part of the assessment infrastructure, not an afterthought."
      sideTitle="Protected platform access"
      title="Sign in to IQMeridian."
    >
      <LoginForm callbackUrl={callbackUrl} />
    </PublicAuthShell>
  );
}