import { RoleAwareLoginForm } from '@/components/auth/role-aware-login-form';

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl ?? '/dashboard';

  return (
    <RoleAwareLoginForm
      callbackUrl={callbackUrl}
      description="Use your IQMeridian account credentials."
      eyebrow="IQMERIDIAN"
      title="Sign in"
    />
  );
}
