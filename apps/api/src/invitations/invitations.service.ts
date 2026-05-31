import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus, InvitationStatus, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createInvitation(input: {
    campaignId: string;
    email: string;
    candidateUserId?: string;
    expiresAt?: string;
    requestingUser: RequestUser;
  }) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: input.campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    this.assertCanManageCampaign(input.requestingUser, campaign.organisationId);

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException(
        'Invitations can only be created for active campaigns',
      );
    }

    const invitation = await this.prisma.invitation.create({
      data: {
        campaignId: input.campaignId,
        email: input.email,
        token: randomUUID(),
        candidateUserId: input.candidateUserId,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });

    await this.auditService.record({
      action: 'INVITATION_CREATED',
      userId: input.requestingUser.id,
      entityType: 'Invitation',
      entityId: invitation.id,
      metadata: {
        campaignId: invitation.campaignId,
        email: invitation.email,
        status: invitation.status,
        candidateUserId: invitation.candidateUserId,
        expiresAt: invitation.expiresAt,
      },
    });

    return invitation;
  }

  async validateInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        campaign: {
          include: {
            assessmentForm: true,
          },
        },
        candidateUser: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is not pending');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      const expiredInvitation = await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });

      await this.auditService.record({
        action: 'INVITATION_EXPIRED',
        userId: null,
        entityType: 'Invitation',
        entityId: expiredInvitation.id,
        metadata: {
          campaignId: expiredInvitation.campaignId,
          email: expiredInvitation.email,
          status: expiredInvitation.status,
          expiredAt: expiredInvitation.expiresAt,
        },
      });

      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  async acceptInvitation(id: string, actorUserId?: string) {
    const invitation = await this.prisma.invitation.update({
      where: { id },
      data: {
        status: InvitationStatus.ACCEPTED,
        usedAt: new Date(),
      },
    });

    await this.auditService.record({
      action: 'INVITATION_ACCEPTED',
      userId: actorUserId ?? invitation.candidateUserId ?? null,
      entityType: 'Invitation',
      entityId: invitation.id,
      metadata: {
        campaignId: invitation.campaignId,
        email: invitation.email,
        status: invitation.status,
        candidateUserId: invitation.candidateUserId,
        usedAt: invitation.usedAt,
      },
    });

    return invitation;
  }

  private assertCanManageCampaign(user: RequestUser, organisationId: string) {
    if (user.role === UserRole.PLATFORM_ADMIN) {
      return;
    }

    if (
      user.role === UserRole.EMPLOYER_ADMIN &&
      user.organisationId === organisationId
    ) {
      return;
    }

    throw new ForbiddenException('Not authorised for this campaign');
  }
}