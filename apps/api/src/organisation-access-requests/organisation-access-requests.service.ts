import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmailDeliveryStatus,
  OrganisationAccessRequestStatus,
  OrganisationAdminInvitationStatus,
  Prisma,
  UserRole,
  VerificationTokenPurpose,
} from '@prisma/client';
import { randomBytes } from 'crypto';

import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationTokensService } from '../verification-tokens/verification-tokens.service';
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
    private readonly emailService: EmailService,
    private readonly verificationTokensService: VerificationTokensService,
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
            role: true,
            status: true,
            emailDeliveryStatus: true,
            lastEmailSentAt: true,
            lastEmailFailure: true,
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
            role: true,
            status: true,
            emailDeliveryStatus: true,
            lastEmailSentAt: true,
            lastEmailFailure: true,
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
              role: true,
              status: true,
              emailDeliveryStatus: true,
              lastEmailSentAt: true,
              lastEmailFailure: true,
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

    const tokenExpiryDate = this.getAdminInvitationExpiryDate();

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
          token: this.generateLegacyInvitationReference(),
          role: UserRole.EMPLOYER_ADMIN,
          status: OrganisationAdminInvitationStatus.PENDING,
          emailDeliveryStatus: EmailDeliveryStatus.NOT_SENT,
          invitedById: user.id,
          expiresAt: tokenExpiryDate,
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
              role: true,
              status: true,
              emailDeliveryStatus: true,
              lastEmailSentAt: true,
              lastEmailFailure: true,
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

    const verificationToken = await this.verificationTokensService.createToken({
      purpose: VerificationTokenPurpose.ORGANISATION_ADMIN_INVITATION,
      email: result.adminInvitation.email,
      expiresAt: tokenExpiryDate,
      organisationAdminInvitationId: result.adminInvitation.id,
      metadata: {
        organisationAccessRequestId: result.request.id,
        organisationId: result.organisation.id,
      },
      revokeExisting: true,
    });

    const invitationUrl = `${this.getWebAppBaseUrl()}/employer-admin-invitations/${encodeURIComponent(
      verificationToken.rawToken,
    )}`;

    let emailDeliveryStatus: EmailDeliveryStatus = EmailDeliveryStatus.SENT;
    let emailFailure: string | null = null;

    try {
      await this.emailService.sendOrganisationAdminInvitationEmail({
        to: {
          email: result.adminInvitation.email,
          name: request.contactName,
        },
        organisationName: result.organisation.name,
        invitationUrl,
        expiresAt: tokenExpiryDate,
      });

      await this.prisma.organisationAdminInvitation.update({
        where: {
          id: result.adminInvitation.id,
        },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.SENT,
          lastEmailSentAt: new Date(),
          lastEmailFailure: null,
        },
      });
    } catch (error) {
      emailDeliveryStatus = EmailDeliveryStatus.FAILED;
      emailFailure =
        error instanceof Error
          ? error.message.slice(0, 500)
          : 'Email delivery failed.';

      await this.prisma.organisationAdminInvitation.update({
        where: {
          id: result.adminInvitation.id,
        },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.FAILED,
          lastEmailFailure: emailFailure,
        },
      });
    }

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
        emailDeliveryStatus,
        emailFailure,
      }),
    });

    return {
      request: await this.getById(result.request.id),
      organisation: {
        id: result.organisation.id,
        name: result.organisation.name,
        createdAt: result.organisation.createdAt,
      },
      adminInvitation: {
        id: result.adminInvitation.id,
        email: result.adminInvitation.email,
        role: result.adminInvitation.role,
        status: result.adminInvitation.status,
        emailDeliveryStatus,
        lastEmailFailure: emailFailure,
        expiresAt: result.adminInvitation.expiresAt,
        createdAt: result.adminInvitation.createdAt,
      },
    };
  }

  async resendAdminInvitationEmail(id: string, user: RequestUser) {
    const request = await this.prisma.organisationAccessRequest.findUnique({
      where: {
        id,
      },
      include: {
        adminInvitation: {
          include: {
            organisation: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Organisation access request not found');
    }

    if (request.status !== OrganisationAccessRequestStatus.CONVERTED) {
      throw new BadRequestException(
        'Only converted organisation access requests can have employer-admin invitations resent.',
      );
    }

    if (!request.adminInvitation) {
      throw new NotFoundException(
        'Employer-admin invitation not found for this request.',
      );
    }

    if (
      request.adminInvitation.status !== OrganisationAdminInvitationStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending employer-admin invitations can be resent.',
      );
    }

    const expiresAt = this.getAdminInvitationExpiryDate();

    const updatedInvitation =
      await this.prisma.organisationAdminInvitation.update({
        where: {
          id: request.adminInvitation.id,
        },
        data: {
          expiresAt,
          emailDeliveryStatus: EmailDeliveryStatus.NOT_SENT,
          lastEmailFailure: null,
        },
        include: {
          organisation: true,
        },
      });

    const verificationToken = await this.verificationTokensService.createToken({
      purpose: VerificationTokenPurpose.ORGANISATION_ADMIN_INVITATION,
      email: updatedInvitation.email,
      expiresAt,
      organisationAdminInvitationId: updatedInvitation.id,
      metadata: {
        organisationAccessRequestId: request.id,
        organisationId: updatedInvitation.organisationId,
        resentByUserId: user.id,
      },
      revokeExisting: true,
    });

    const invitationUrl = `${this.getWebAppBaseUrl()}/employer-admin-invitations/${encodeURIComponent(
      verificationToken.rawToken,
    )}`;

    let emailDeliveryStatus: EmailDeliveryStatus = EmailDeliveryStatus.SENT;
    let emailFailure: string | null = null;

    try {
      await this.emailService.sendOrganisationAdminInvitationEmail({
        to: {
          email: updatedInvitation.email,
          name: request.contactName,
        },
        organisationName: updatedInvitation.organisation.name,
        invitationUrl,
        expiresAt,
      });

      await this.prisma.organisationAdminInvitation.update({
        where: {
          id: updatedInvitation.id,
        },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.SENT,
          lastEmailSentAt: new Date(),
          lastEmailFailure: null,
        },
      });
    } catch (error) {
      emailDeliveryStatus = EmailDeliveryStatus.FAILED;
      emailFailure =
        error instanceof Error
          ? error.message.slice(0, 500)
          : 'Email delivery failed.';

      await this.prisma.organisationAdminInvitation.update({
        where: {
          id: updatedInvitation.id,
        },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.FAILED,
          lastEmailFailure: emailFailure,
        },
      });
    }

    await this.auditService.record({
      action: 'ORGANISATION_ADMIN_INVITATION_EMAIL_RESENT',
      userId: user.id,
      entityType: 'OrganisationAdminInvitation',
      entityId: updatedInvitation.id,
      metadata: this.toJsonValue({
        organisationAccessRequestId: request.id,
        organisationId: updatedInvitation.organisationId,
        adminInvitationId: updatedInvitation.id,
        contactEmail: updatedInvitation.email,
        emailDeliveryStatus,
        emailFailure,
      }),
    });

    return {
      request: await this.getById(request.id),
      adminInvitation: {
        id: updatedInvitation.id,
        email: updatedInvitation.email,
        role: updatedInvitation.role,
        status: updatedInvitation.status,
        emailDeliveryStatus,
        lastEmailFailure: emailFailure,
        expiresAt,
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

  private generateLegacyInvitationReference() {
    return `legacy_${randomBytes(24).toString('base64url')}`;
  }

  private getAdminInvitationExpiryDate() {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 14);

    return expiresAt;
  }

  private getWebAppBaseUrl() {
    const baseUrl =
      process.env.WEB_APP_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000';

    if (process.env.NODE_ENV === 'production' && !process.env.WEB_APP_URL) {
      throw new Error('WEB_APP_URL is required in production.');
    }

    return baseUrl.replace(/\/$/, '');
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}