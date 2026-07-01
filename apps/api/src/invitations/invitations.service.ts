import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CampaignStatus,
  InvitationStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
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
    const email = input.email.trim().toLowerCase();

    if (!email) {
      throw new BadRequestException('Candidate email is required');
    }

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: input.campaignId },
      include: {
        assessmentForm: true,
      },
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

    if (!campaign.assessmentFormId || !campaign.assessmentForm) {
      throw new BadRequestException(
        'Campaign must have an assessment form before candidates can be invited',
      );
    }

    if (!campaign.assessmentForm.isActive) {
      throw new BadRequestException(
        'Campaign assessment form is not currently active',
      );
    }

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Invitation expiry date is invalid');
    }

    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException('Invitation expiry date must be in future');
    }

    const candidateUserId = await this.resolveCandidateUserId({
      candidateUserId: input.candidateUserId,
      email,
    });

    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        campaignId: input.campaignId,
        email,
        status: {
          in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED],
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingInvitation) {
      throw new BadRequestException(
        'An active invitation already exists for this candidate email in this campaign',
      );
    }

    const invitation = await this.prisma.invitation.create({
      data: {
        campaignId: input.campaignId,
        email,
        token: randomUUID(),
        candidateUserId,
        expiresAt,
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

    if (
      invitation.status !== InvitationStatus.PENDING &&
      invitation.status !== InvitationStatus.ACCEPTED
    ) {
      throw new BadRequestException('Invitation is no longer available');
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

    async listPendingCandidateInvitations(user: RequestUser) {
    const candidate = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate user not found');
    }

    if (candidate.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidate accounts can view invitations');
    }

    const email = candidate.email.trim().toLowerCase();
    const now = new Date();

    return this.prisma.invitation.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        status: {
          in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED],
        },
        OR: [
          {
            candidateUserId: null,
          },
          {
            candidateUserId: candidate.id,
          },
        ],
        expiresAt: {
          gt: now,
        },
        sessions: {
          none: {},
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        campaign: {
          include: {
            organisation: {
              select: {
                id: true,
                name: true,
              },
            },
            assessmentForm: {
              select: {
                id: true,
                name: true,
                version: true,
                versionLabel: true,
              },
            },
          },
        },
      },
    });
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

  private async resolveCandidateUserId(input: {
    candidateUserId?: string;
    email: string;
  }) {
    const candidateUserId = input.candidateUserId?.trim();

    if (!candidateUserId) {
      return undefined;
    }

    const candidate = await this.prisma.user.findUnique({
      where: {
        id: candidateUserId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate user was not found');
    }

    if (candidate.role !== UserRole.CANDIDATE) {
      throw new BadRequestException(
        'Selected candidate user must have the CANDIDATE role',
      );
    }

    if (candidate.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Selected candidate account is not active');
    }

    if (candidate.email.trim().toLowerCase() !== input.email) {
      throw new BadRequestException(
        'Selected candidate user email does not match the invitation email',
      );
    }

    return candidate.id;
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