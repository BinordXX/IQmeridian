import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RequestUser } from '../auth/request-user.type';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

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
      status: 'ACTIVE',
      organisationId: null,
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
      status: 'ACTIVE',
      organisationId: null,
      authSessionId: '',
    });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        organisationId,
        role: UserRole.EMPLOYER_ADMIN,
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
      },
    });

    return user;
  }

  private assertCanReadOrganisation(user: RequestUser, organisationId: string) {
    if (user.role === UserRole.PLATFORM_ADMIN) {
      return;
    }

    if (
      user.role === UserRole.EMPLOYER_ADMIN &&
      user.organisationId === organisationId
    ) {
      return;
    }

    throw new ForbiddenException('Not authorised for this organisation');
  }
}
