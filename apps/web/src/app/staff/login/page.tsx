import { RoleAwareLoginForm } from '@/components/auth/role-aware-login-form';

type StaffLoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function StaffLoginPage({
  searchParams,
}: StaffLoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl ?? '/internal';

  return (
    <RoleAwareLoginForm
      allowedRoles={['PLATFORM_ADMIN', 'RESEARCHER']}
      callbackUrl={callbackUrl}
      description="For platform administrators and research staff."
      eyebrow="IQMERIDIAN INTERNAL ACCESS"
      nonMatchingRoleMessage="This account is signed in, but it is not assigned to the internal workspace."
      submitLabel="Sign in to internal workspace"
      title="Internal sign in"
    />
  );
}
