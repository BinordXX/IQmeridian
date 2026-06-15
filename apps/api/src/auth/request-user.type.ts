import { UserRole, UserStatus } from '@prisma/client';

export type RoleName = `${UserRole}`;
export type UserStatusName = `${UserStatus}`;

export type RequestUser = {
  id: string;
  email: string;
  name: string | null;
  role: RoleName;
  status: UserStatusName;
  organisationId: string | null;
  authSessionId: string;
};
