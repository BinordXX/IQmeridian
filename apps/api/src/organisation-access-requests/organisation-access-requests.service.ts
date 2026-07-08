import { ConflictException, Injectable } from '@nestjs/common';
import { OrganisationAccessRequestStatus, Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganisationAccessRequestDto } from './dto/create-organisation-access-request.dto';

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

  private toOptionalString(value?: string) {
    const trimmedValue = value?.trim();

    return trimmedValue ? trimmedValue : null;
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}