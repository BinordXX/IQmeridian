import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCampaign(input: {
    name: string;
    organisationId: string;
    ownerId?: string;
    assessmentFormId?: string;
    requestingUser: {
      id: string;
      role: string;
      organisationId?: string | null;
    };
  }) {
    this.assertCanManageOrganisation(
      input.requestingUser,
      input.organisationId,
    );

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

    return this.prisma.campaign.create({
      data: {
        name: input.name,
        organisationId: input.organisationId,
        ownerId: input.ownerId ?? input.requestingUser.id,
        assessmentFormId: input.assessmentFormId,
      },
      include: {
        organisation: true,
        owner: true,
        assessmentForm: true,
      },
    });
  }

  async findCampaignsForUser(user: {
    role: string;
    organisationId?: string | null;
  }) {
    if (user.role === UserRole.PLATFORM_ADMIN) {
      return this.prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          organisation: true,
          assessmentForm: true,
        },
      });
    }

    if (!user.organisationId) {
      throw new ForbiddenException('User is not attached to an organisation');
    }

    return this.prisma.campaign.findMany({
      where: {
        organisationId: user.organisationId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        organisation: true,
        assessmentForm: true,
      },
    });
  }

  async findCampaignById(
    id: string,
    user: { role: string; organisationId?: string | null },
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        organisation: true,
        owner: true,
        assessmentForm: true,
        invitations: true,
        sessions: true,
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
    user: { role: string; organisationId?: string | null },
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    this.assertCanManageOrganisation(user, campaign.organisationId);

    this.assertValidStatusTransition(campaign.status, status);

    return this.prisma.campaign.update({
      where: { id },
      data: { status },
    });
  }

  private assertCanManageOrganisation(
    user: { role: string; organisationId?: string | null },
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