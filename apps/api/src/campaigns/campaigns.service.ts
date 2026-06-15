import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus, Prisma, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createCampaign(input: {
    name: string;
    organisationId: string;
    ownerId?: string;
    assessmentFormId?: string;
    requestingUser: RequestUser;
  }) {
    const organisationId =
      input.requestingUser.role === UserRole.PLATFORM_ADMIN
        ? input.organisationId
        : input.requestingUser.organisationId;

    if (!organisationId) {
      throw new ForbiddenException('User is not attached to an organisation');
    }

    this.assertCanManageOrganisation(input.requestingUser, organisationId);

    if (input.assessmentFormId) {
      const form = await this.prisma.assessmentForm.findUnique({
        where: { id: input.assessmentFormId },
      });

      if (!form) {
        throw new NotFoundException('Assessment form not found');
      }

      if (!form.isActive) {
        throw new BadRequestException('Only active forms can be assigned');
      }
    }

    const ownerId =
      input.requestingUser.role === UserRole.PLATFORM_ADMIN
        ? (input.ownerId ?? input.requestingUser.id)
        : input.requestingUser.id;

    const campaign = await this.prisma.campaign.create({
      data: {
        name: input.name,
        organisationId,
        ownerId,
        assessmentFormId: input.assessmentFormId,
      },
      include: {
        organisation: true,
        owner: true,
        assessmentForm: true,
      },
    });

    await this.auditService.record({
      action: 'CAMPAIGN_CREATED',
      userId: input.requestingUser.id,
      entityType: 'Campaign',
      entityId: campaign.id,
      metadata: {
        name: campaign.name,
        organisationId: campaign.organisationId,
        ownerId: campaign.ownerId,
        assessmentFormId: campaign.assessmentFormId,
        status: campaign.status,
      },
    });

    return campaign;
  }

  async findCampaignsForUser(
    user: RequestUser,
    filters: {
      page?: number;
      limit?: number;
      status?: CampaignStatus;
      organisationId?: string;
      assessmentFormId?: string;
      ownerId?: string;
    } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    let organisationId = filters.organisationId;

    if (user.role !== UserRole.PLATFORM_ADMIN) {
      if (!user.organisationId) {
        throw new ForbiddenException('User is not attached to an organisation');
      }

      organisationId = user.organisationId;
    }

    const where: Prisma.CampaignWhereInput = {
      ...(organisationId ? { organisationId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.assessmentFormId
        ? { assessmentFormId: filters.assessmentFormId }
        : {}),
      ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.campaign.count({ where }),
      this.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          organisation: true,
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              organisationId: true,
            },
          },
          assessmentForm: true,
        },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async findCampaignById(id: string, user: RequestUser) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        organisation: true,
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organisationId: true,
          },
        },
        assessmentForm: true,
        invitations: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        sessions: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                organisationId: true,
              },
            },
            invitation: true,
            responses: true,
            score: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    this.assertCanManageOrganisation(user, campaign.organisationId);

    return campaign;
  }

  async updateCampaignStatus(
    id: string,
    status: CampaignStatus,
    user: RequestUser,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    this.assertCanManageOrganisation(user, campaign.organisationId);
    this.assertValidStatusTransition(campaign.status, status);

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: { status },
    });

    await this.auditService.record({
      action: 'CAMPAIGN_STATUS_UPDATED',
      userId: user.id,
      entityType: 'Campaign',
      entityId: updatedCampaign.id,
      metadata: {
        previousStatus: campaign.status,
        newStatus: updatedCampaign.status,
        organisationId: updatedCampaign.organisationId,
        assessmentFormId: updatedCampaign.assessmentFormId,
      },
    });

    return updatedCampaign;
  }

  private assertCanManageOrganisation(
    user: RequestUser,
    organisationId: string,
  ) {
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

  private assertValidStatusTransition(
    current: CampaignStatus,
    next: CampaignStatus,
  ) {
    const allowed: Record<CampaignStatus, CampaignStatus[]> = {
      DRAFT: [CampaignStatus.ACTIVE, CampaignStatus.ARCHIVED],
      ACTIVE: [CampaignStatus.CLOSED, CampaignStatus.ARCHIVED],
      CLOSED: [CampaignStatus.ARCHIVED],
      ARCHIVED: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(
        `Invalid campaign status transition from ${current} to ${next}`,
      );
    }
  }
}
