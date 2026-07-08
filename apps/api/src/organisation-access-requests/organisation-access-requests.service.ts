import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrganisationAccessRequestStatus,
  OrganisationAdminInvitationStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { randomBytes } from 'crypto';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganisationAccessRequestDto } from './dto/create-organisation-access-request.dto';
import { ReviewOrganisationAccessRequestDto } from './dto/review-organisation-access-request.dto';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Injectable()
export class OrganisationAccessRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateOrganisationAccessRequestDto) {
    const contactEmail = dto.contactEmail.trim().toLowerCase();

    const existingPendingRequest =
      await this.prisma.organisationAccessRequest.findFirst({
        where: {
          contactEmail,
          status: OrganisationAccessRequestStatus.PENDING,
        },
        select: {
          id: true,
        },
      });

    if (existingPendingRequest) {
      throw new ConflictException(
        'An organisation access request from this contact email is already pending review.',
      );
    }

    const request = await this.prisma.organisationAccessRequest.create({
      data: {
        organisationName: dto.organisationName.trim(),
        website: this.toOptionalString(dto.website),
        industry: this.toOptionalString(dto.industry),
        country: this.toOptionalString(dto.country),
        contactName: dto.contactName.trim(),
        contactEmail,
        contactPhone: this.toOptionalString(dto.contactPhone),
        intendedUse: dto.intendedUse.trim(),
        expectedVolume: this.toOptionalString(dto.expectedVolume),
      },
    });

    await this.auditService.record({
      action: 'ORGANISATION_ACCESS_REQUEST_SUBMITTED',
      userId: null,
      entityType: 'OrganisationAccessRequest',
      entityId: request.id,
      metadata: this.toJsonValue({
        organisationName: request.organisationName,
        contactEmail: request.contactEmail,
        status: request.status,
      }),
    });

    return {
      id: request.id,
      organisationName: request.organisationName,
      contactEmail: request.contactEmail,
      status: request.status,
      createdAt: request.createdAt,
    };
  }

  async list(status?: string) {
    const statusFilter = this.toStatusFilter(status);

    return this.prisma.organisationAccessRequest.findMany({
      where: statusFilter
        ? {
            status: statusFilter,
          }
        : {},
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        adminInvitation: {
          select: {
            id: true,
            email: true,
            token: true,
            role: true,
            status: true,
            expiresAt: true,
            usedAt: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async getById(id: string) {
    const request = await this.prisma.organisationAccessRequest.findUnique({
      where: {
        id,
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        adminInvitation: {
          select: {
            id: true,
            email: true,
            token: true,
            role: true,
            status: true,
            expiresAt: true,
            usedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Organisation access request not found');
    }

    return request;
  }

  async review(
    id: string,
    dto: ReviewOrganisationAccessRequestDto,
    user: RequestUser,
  ) {
    const request = await this.prisma.organisationAccessRequest.findUnique({
      where: {
        id,
      },
    });

    if (!request) {
      throw new NotFoundException('Organisation access request not found');
    }

    if (request.status === OrganisationAccessRequestStatus.CONVERTED) {
      throw new ConflictException(
        'Converted organisation access requests cannot be reviewed again.',
      );
    }

    const updatedRequest =
      await this.prisma.organisationAccessRequest.update({
        where: {
          id,
        },
        data: {
          status: dto.status,
          reviewedAt: new Date(),
          reviewedById: user.id,
          reviewNotes: this.toOptionalString(dto.reviewNotes),
        },
        include: {
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          adminInvitation: {
            select: {
              id: true,
              email: true,
              token: true,
              role: true,
              status: true,
              expiresAt: true,
              usedAt: true,
              createdAt: true,
            },
          },
        },
      });

    await this.auditService.record({
      action: 'ORGANISATION_ACCESS_REQUEST_REVIEWED',
      userId: user.id,
      entityType: 'OrganisationAccessRequest',
      entityId: updatedRequest.id,
      metadata: this.toJsonValue({
        organisationName: updatedRequest.organisationName,
        contactEmail: updatedRequest.contactEmail,
        previousStatus: request.status,
        status: updatedRequest.status,
        reviewedById: user.id,
      }),
    });

    return updatedRequest;
  }

  async convert(id: string, user: RequestUser) {
    const request = await this.prisma.organisationAccessRequest.findUnique({
      where: {
        id,
      },
      include: {
        adminInvitation: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Organisation access request not found');
    }

    if (request.status === OrganisationAccessRequestStatus.CONVERTED) {
      throw new ConflictException(
        'This organisation access request has already been converted.',
      );
    }

    if (request.status !== OrganisationAccessRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved organisation access requests can be converted.',
      );
    }

    if (request.adminInvitation) {
      throw new ConflictException(
        'This organisation access request already has an employer admin invitation.',
      );
    }

    const existingOrganisation = request.convertedOrganisationId
      ? await this.prisma.organisation.findUnique({
          where: {
            id: request.convertedOrganisationId,
          },
          select: {
            id: true,
          },
        })
      : null;

    if (existingOrganisation) {
      throw new ConflictException(
        'This organisation access request already points to an organisation.',
      );
    }

    const token = this.generateInvitationToken();
    const expiresAt = this.getAdminInvitationExpiryDate();

    const result = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          name: request.organisationName.trim(),
        },
      });

      const adminInvitation = await tx.organisationAdminInvitation.create({
        data: {
          organisationId: organisation.id,
          organisationAccessRequestId: request.id,
          email: request.contactEmail,
          token,
          role: UserRole.EMPLOYER_ADMIN,
          status: OrganisationAdminInvitationStatus.PENDING,
          invitedById: user.id,
          expiresAt,
        },
      });

      const updatedRequest = await tx.organisationAccessRequest.update({
        where: {
          id: request.id,
        },
        data: {
          status: OrganisationAccessRequestStatus.CONVERTED,
          convertedOrganisationId: organisation.id,
        },
        include: {
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          adminInvitation: {
            select: {
              id: true,
              email: true,
              token: true,
              role: true,
              status: true,
              expiresAt: true,
              usedAt: true,
              createdAt: true,
            },
          },
        },
      });

      return {
        organisation,
        adminInvitation,
        request: updatedRequest,
      };
    });

    await this.auditService.record({
      action: 'ORGANISATION_ACCESS_REQUEST_CONVERTED',
      userId: user.id,
      entityType: 'OrganisationAccessRequest',
      entityId: result.request.id,
      metadata: this.toJsonValue({
        organisationAccessRequestId: result.request.id,
        organisationId: result.organisation.id,
        adminInvitationId: result.adminInvitation.id,
        contactEmail: result.adminInvitation.email,
        status: result.request.status,
      }),
    });

    return {
      request: result.request,
      organisation: {
        id: result.organisation.id,
        name: result.organisation.name,
        createdAt: result.organisation.createdAt,
      },
      adminInvitation: {
        id: result.adminInvitation.id,
        email: result.adminInvitation.email,
        token: result.adminInvitation.token,
        role: result.adminInvitation.role,
        status: result.adminInvitation.status,
        expiresAt: result.adminInvitation.expiresAt,
        createdAt: result.adminInvitation.createdAt,
      },
    };
  }

  private toStatusFilter(status?: string) {
    if (!status) {
      return undefined;
    }

    if (
      Object.values(OrganisationAccessRequestStatus).includes(
        status as OrganisationAccessRequestStatus,
      )
    ) {
      return status as OrganisationAccessRequestStatus;
    }

    throw new BadRequestException(
      'Invalid organisation access request status filter.',
    );
  }

  private toOptionalString(value?: string | null) {
    const trimmedValue = value?.trim();

    return trimmedValue ? trimmedValue : null;
  }

  private generateInvitationToken() {
    return randomBytes(32).toString('base64url');
  }

  private getAdminInvitationExpiryDate() {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 14);

    return expiresAt;
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}