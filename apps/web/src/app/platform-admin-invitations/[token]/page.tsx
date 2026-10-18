import { PlatformAdminInvitationAcceptance } from './platform-admin-invitation-acceptance';

type PlatformAdminInvitationPageProps = {
  params:
    | {
        token: string;
      }
    | Promise<{
        token: string;
      }>;
};

export default async function PlatformAdminInvitationPage({
  params,
}: PlatformAdminInvitationPageProps) {
  const { token } = await Promise.resolve(params);

  return <PlatformAdminInvitationAcceptance token={token} />;
}