import {
  OrganisationMembershipStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';

export type RoleName = `${UserRole}`;
export type UserStatusName = `${UserStatus}`;
export type OrganisationMembershipStatusName =
  `${OrganisationMembershipStatus}`;

export type RequestUserOrganisationMembership = {
  id: string;
  organisationId: string;
  organisationName: string | null;
  role: RoleName;
  status: OrganisationMembershipStatusName;
};

export type RequestUser = {
  id: string;
  email: string;
  name: string | null;
  role: RoleName;
  roles: RoleName[];
  status: UserStatusName;
  organisationId: string | null;
  organisationMemberships: RequestUserOrganisationMembership[];
  authSessionId: string;
};

export function userHasRole(user: RequestUser, role: RoleName) {
  return user.roles.includes(role);
}

export function userHasOrganisationRole(
  user: RequestUser,
  organisationId: string,
  role: RoleName,
) {
  return user.organisationMemberships.some(
    (membership) =>
      membership.organisationId === organisationId &&
      membership.role === role &&
      membership.status === OrganisationMembershipStatus.ACTIVE,
  );
}

export function userCanManageOrganisation(
  user: RequestUser,
  organisationId: string,
) {
  if (user.role === UserRole.PLATFORM_ADMIN) {
    return true;
  }

  if (
    user.role === UserRole.EMPLOYER_ADMIN &&
    user.organisationId === organisationId
  ) {
    return true;
  }

  return userHasOrganisationRole(user, organisationId, UserRole.EMPLOYER_ADMIN);
}

export function getPrimaryEmployerOrganisationId(user: RequestUser) {
  if (user.role === UserRole.EMPLOYER_ADMIN && user.organisationId) {
    return user.organisationId;
  }

  return (
    user.organisationMemberships.find(
      (membership) =>
        membership.role === UserRole.EMPLOYER_ADMIN &&
        membership.status === OrganisationMembershipStatus.ACTIVE,
    )?.organisationId ?? null
  );
}
