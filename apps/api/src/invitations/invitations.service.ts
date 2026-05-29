import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CampaignStatus, InvitationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvitation(input: {
    campaignId: string;
    email: string;
    candidateUserId?: string;
    expiresAt?: string;
  }) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: input.campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('Invitations can only be created for active campaigns');
    }

    return this.prisma.invitation.create({
      data: {
        campaignId: input.campaignId,
        email: input.email,
        token: randomUUID(),
        candidateUserId: input.candidateUserId,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });
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
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });

      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  acceptInvitation(id: string) {
    return this.prisma.invitation.update({
      where: { id },
      data: {
        status: InvitationStatus.ACCEPTED,
        usedAt: new Date(),
      },
    });
  }
}