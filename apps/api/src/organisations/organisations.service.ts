import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrganisationMembershipStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
type RequestUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  roles?: string[];
  status: string;
  organisationId?: string | null;
  organisationMemberships?: {
    organisationId: string;
    role: string;
    status: string;
  }[];
  authSessionId: string;
};

function hasRole(user: RequestUser, role: UserRole) {
  return user.role === role || user.roles?.includes(role) === true;
}

function hasActiveOrganisationRole(
  user: RequestUser,
  organisationId: string,
  role: UserRole,
) {
  return (
    user.organisationMemberships?.some(
      (membership) =>
        membership.organisationId === organisationId &&
        membership.role === role &&
        membership.status === 'ACTIVE',
    ) === true
  );
}

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createOrganisation(name: string, actorUserId: string) {
    const organisation = await this.prisma.organisation.create({
      data: { name },
    });

    await this.auditService.record({
      action: 'ORGANISATION_CREATED',
      userId: actorUserId,
      entityType: 'Organisation',
      entityId: organisation.id,
      metadata: {
        name: organisation.name,
      },
    });

    return organisation;
  }

  findAllOrganisations() {
    return this.prisma.organisation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            organisationId: true,
            emailVerifiedAt: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        campaigns: true,
      },
    });
  }
  private assertCanReadOrganisation(user: RequestUser, organisationId: string) {
    if (hasRole(user, UserRole.PLATFORM_ADMIN)) {
      return;
    }

    if (
      user.role === UserRole.EMPLOYER_ADMIN &&
      user.organisationId === organisationId
    ) {
      return;
    }

    if (
      hasActiveOrganisationRole(user, organisationId, UserRole.EMPLOYER_ADMIN)
    ) {
      return;
    }

    throw new ForbiddenException('Not authorised for this organisation');
  }

  async findOrganisationById(id: string, user: RequestUser) {
    this.assertCanReadOrganisation(user, id);

    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            organisationId: true,
            emailVerifiedAt: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        campaigns: true,
      },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return organisation;
  }

  async updateOrganisation(id: string, name: string, actorUserId: string) {
    await this.findOrganisationById(id, {
      id: actorUserId,
      email: '',
      name: null,
      role: UserRole.PLATFORM_ADMIN,
      roles: [UserRole.PLATFORM_ADMIN],
      status: UserStatus.ACTIVE,
      organisationId: null,
      organisationMemberships: [],
      authSessionId: '',
    });

    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: { name },
    });

    await this.auditService.record({
      action: 'ORGANISATION_UPDATED',
      userId: actorUserId,
      entityType: 'Organisation',
      entityId: organisation.id,
      metadata: {
        name: organisation.name,
      },
    });

    return organisation;
  }

  async attachEmployerAdminToOrganisation(
    organisationId: string,
    userId: string,
    actorUserId: string,
  ) {
    await this.findOrganisationById(organisationId, {
      id: actorUserId,
      email: '',
      name: null,
      role: UserRole.PLATFORM_ADMIN,
      roles: [UserRole.PLATFORM_ADMIN],
      status: UserStatus.ACTIVE,
      organisationId: null,
      organisationMemberships: [],
      authSessionId: '',
    });

    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        status: true,
        organisationId: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User was not found.');
    }

    if (targetUser.role === UserRole.PLATFORM_ADMIN) {
      throw new BadRequestException(
        'Platform admins cannot be reassigned as employer admins.',
      );
    }

    if (
      targetUser.role !== UserRole.CONSUMER &&
      targetUser.role !== UserRole.EMPLOYER_ADMIN
    ) {
      throw new BadRequestException(
        'Only consumers or existing employer admins can be attached as employer admins.',
      );
    }

    if (targetUser.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        'Only active users can be attached as employer admins.',
      );
    }

    await this.prisma.organisationMembership.upsert({
      where: {
        organisationId_userId: {
          organisationId,
          userId,
        },
      },
      create: {
        organisationId,
        userId,
        role: UserRole.EMPLOYER_ADMIN,
        status: OrganisationMembershipStatus.ACTIVE,
      },
      update: {
        role: UserRole.EMPLOYER_ADMIN,
        status: OrganisationMembershipStatus.ACTIVE,
      },
    });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(targetUser.organisationId ? {} : { organisationId }),
        ...(targetUser.role === UserRole.EMPLOYER_ADMIN
          ? {}
          : { role: targetUser.role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        organisationId: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        organisation: true,
        organisationMemberships: {
          where: {
            status: OrganisationMembershipStatus.ACTIVE,
          },
          include: {
            organisation: true,
          },
        },
      },
    });

    await this.auditService.record({
      action: 'EMPLOYER_ADMIN_ATTACHED',
      userId: actorUserId,
      entityType: 'User',
      entityId: user.id,
      metadata: {
        organisationId,
        assignedRole: UserRole.EMPLOYER_ADMIN,
        accessModel: 'organisation_membership',
      },
    });

    return user;
  }
}
