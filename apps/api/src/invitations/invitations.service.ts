import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  CandidateAccessMode,
  CampaignStatus,
  EmailDeliveryStatus,
  InvitationStatus,
  OrganisationParticipantStatus,
  OrganisationParticipantType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';

import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
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
    private readonly emailService: EmailService,
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
        organisation: {
          select: {
            id: true,
            name: true,
            candidateAccessMode: true,
          },
        },
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

    const participant = candidateUserId
      ? await this.ensureOrganisationParticipant({
          organisationId: campaign.organisationId,
          userId: candidateUserId,
          accessMode:
            campaign.organisation?.candidateAccessMode ??
            CandidateAccessMode.ONE_OFF,
        })
      : null;

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
        participantId: participant?.id,
        expiresAt,
        emailDeliveryStatus: EmailDeliveryStatus.NOT_SENT,
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
        participantId: invitation.participantId,
        emailDeliveryStatus: invitation.emailDeliveryStatus,
      },
    });

    const delivery = await this.deliverCandidateInvitationEmail({
      invitationId: invitation.id,
      token: invitation.token,
      email: invitation.email,
      campaignId: invitation.campaignId,
      campaignName: campaign.name,
      organisationName: campaign.organisation?.name ?? null,
      expiresAt: invitation.expiresAt,
      userId: input.requestingUser.id,
      failureAuditAction: 'INVITATION_EMAIL_DELIVERY_FAILED',
      successAuditAction: 'INVITATION_EMAIL_SENT',
    });

    return delivery.invitation;
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
      throw new ForbiddenException(
        'Only candidate accounts can view invitations',
      );
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

  async resendInvitation(id: string, user: RequestUser) {
    const invitation = await this.getManageableInvitation(id, user);

    this.assertInvitationHasNoSession(invitation.sessions.length);

    if (
      invitation.status !== InvitationStatus.PENDING &&
      invitation.status !== InvitationStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        'Only pending or accepted invitations without sessions can be resent',
      );
    }

    if (invitation.expiresAt && invitation.expiresAt <= new Date()) {
      throw new BadRequestException(
        'Invitation has expired. Extend the invitation before resending it',
      );
    }

    await this.auditService.record({
      action: 'INVITATION_RESEND_REQUESTED',
      userId: user.id,
      entityType: 'Invitation',
      entityId: invitation.id,
      metadata: {
        campaignId: invitation.campaignId,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        previousEmailDeliveryStatus: invitation.emailDeliveryStatus,
        previousLastEmailSentAt: invitation.lastEmailSentAt,
      },
    });

    const delivery = await this.deliverCandidateInvitationEmail({
      invitationId: invitation.id,
      token: invitation.token,
      email: invitation.email,
      campaignId: invitation.campaignId,
      campaignName: invitation.campaign.name,
      organisationName: invitation.campaign.organisation.name,
      expiresAt: invitation.expiresAt,
      userId: user.id,
      failureAuditAction: 'INVITATION_RESEND_EMAIL_FAILED',
      successAuditAction: 'INVITATION_RESEND_EMAIL_SENT',
    });

    if (!delivery.sent) {
      throw new ServiceUnavailableException(
        'Candidate invitation email could not be sent. The invitation remains available for resend.',
      );
    }

    return delivery.invitation;
  }

  async cancelInvitation(id: string, user: RequestUser) {
    const invitation = await this.getManageableInvitation(id, user);

    this.assertInvitationHasNoSession(invitation.sessions.length);

    if (invitation.status === InvitationStatus.CANCELLED) {
      return invitation;
    }

    if (invitation.status === InvitationStatus.EXPIRED) {
      throw new BadRequestException('Expired invitations cannot be cancelled');
    }

    const cancelledInvitation = await this.prisma.invitation.update({
      where: { id },
      data: {
        status: InvitationStatus.CANCELLED,
      },
      include: this.getInvitationInclude(),
    });

    await this.auditService.record({
      action: 'INVITATION_CANCELLED',
      userId: user.id,
      entityType: 'Invitation',
      entityId: cancelledInvitation.id,
      metadata: {
        campaignId: cancelledInvitation.campaignId,
        email: cancelledInvitation.email,
        previousStatus: invitation.status,
        status: cancelledInvitation.status,
      },
    });

    return this.deliverCandidateInvitationLifecycleEmail({
      invitationId: cancelledInvitation.id,
      token: cancelledInvitation.token,
      email: cancelledInvitation.email,
      campaignId: cancelledInvitation.campaignId,
      campaignName: cancelledInvitation.campaign.name,
      organisationName: cancelledInvitation.campaign.organisation.name,
      expiresAt: cancelledInvitation.expiresAt,
      userId: user.id,
      lifecycle: 'cancelled',
    });
  }

  async extendInvitation(
    id: string,
    input: {
      expiresAt: string;
    },
    user: RequestUser,
  ) {
    const invitation = await this.getManageableInvitation(id, user);

    this.assertInvitationHasNoSession(invitation.sessions.length);

    if (invitation.status === InvitationStatus.CANCELLED) {
      throw new BadRequestException('Cancelled invitations cannot be extended');
    }

    const expiresAt = new Date(input.expiresAt);

    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Invitation expiry date is invalid');
    }

    if (expiresAt <= new Date()) {
      throw new BadRequestException('Invitation expiry date must be in future');
    }

    const nextStatus =
      invitation.status === InvitationStatus.EXPIRED
        ? InvitationStatus.PENDING
        : invitation.status;

    const extendedInvitation = await this.prisma.invitation.update({
      where: { id },
      data: {
        expiresAt,
        status: nextStatus,
      },
      include: this.getInvitationInclude(),
    });

    await this.auditService.record({
      action: 'INVITATION_EXTENDED',
      userId: user.id,
      entityType: 'Invitation',
      entityId: extendedInvitation.id,
      metadata: {
        campaignId: extendedInvitation.campaignId,
        email: extendedInvitation.email,
        previousStatus: invitation.status,
        status: extendedInvitation.status,
        previousExpiresAt: invitation.expiresAt,
        expiresAt: extendedInvitation.expiresAt,
      },
    });

    return this.deliverCandidateInvitationLifecycleEmail({
      invitationId: extendedInvitation.id,
      token: extendedInvitation.token,
      email: extendedInvitation.email,
      campaignId: extendedInvitation.campaignId,
      campaignName: extendedInvitation.campaign.name,
      organisationName: extendedInvitation.campaign.organisation.name,
      expiresAt: extendedInvitation.expiresAt,
      userId: user.id,
      lifecycle: 'extended',
    });
  }

  private async deliverCandidateInvitationLifecycleEmail(input: {
    invitationId: string;
    token: string;
    email: string;
    campaignId: string;
    campaignName: string;
    organisationName: string | null;
    expiresAt?: Date | null;
    userId: string;
    lifecycle: 'extended' | 'cancelled';
  }) {
    const invitationUrl = `${this.getWebAppBaseUrl()}/assessment/invitation/${encodeURIComponent(
      input.token,
    )}`;

    try {
      const deliveryResult =
        input.lifecycle === 'extended'
          ? await this.emailService.sendCandidateInvitationExtendedEmail({
              to: {
                email: input.email,
                name: null,
              },
              organisationName: input.organisationName,
              campaignName: input.campaignName,
              invitationUrl,
              expiresAt: input.expiresAt ?? new Date(),
            })
          : await this.emailService.sendCandidateInvitationCancelledEmail({
              to: {
                email: input.email,
                name: null,
              },
              organisationName: input.organisationName,
              campaignName: input.campaignName,
            });

      const invitation = await this.prisma.invitation.update({
        where: {
          id: input.invitationId,
        },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.SENT,
          lastEmailSentAt: new Date(),
          lastEmailFailure: null,
        },
        include: this.getInvitationInclude(),
      });

      await this.auditService.record({
        action:
          input.lifecycle === 'extended'
            ? 'INVITATION_EXTENSION_EMAIL_SENT'
            : 'INVITATION_CANCELLATION_EMAIL_SENT',
        userId: input.userId,
        entityType: 'Invitation',
        entityId: input.invitationId,
        metadata: {
          campaignId: input.campaignId,
          email: input.email,
          lifecycle: input.lifecycle,
          emailDeliveryStatus: invitation.emailDeliveryStatus,
          lastEmailSentAt: invitation.lastEmailSentAt,
          messageId: deliveryResult.messageId ?? null,
          accepted: deliveryResult.accepted ?? [],
          rejected: deliveryResult.rejected ?? [],
        },
      });

      return invitation;
    } catch (error) {
      const failureMessage =
        error instanceof Error
          ? error.message.slice(0, 500)
          : 'Candidate invitation lifecycle email delivery failed.';

      const invitation = await this.prisma.invitation.update({
        where: {
          id: input.invitationId,
        },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.FAILED,
          lastEmailFailure: failureMessage,
        },
        include: this.getInvitationInclude(),
      });

      await this.auditService.record({
        action:
          input.lifecycle === 'extended'
            ? 'INVITATION_EXTENSION_EMAIL_FAILED'
            : 'INVITATION_CANCELLATION_EMAIL_FAILED',
        userId: input.userId,
        entityType: 'Invitation',
        entityId: input.invitationId,
        metadata: {
          campaignId: input.campaignId,
          email: input.email,
          lifecycle: input.lifecycle,
          emailDeliveryStatus: invitation.emailDeliveryStatus,
          lastEmailFailure: invitation.lastEmailFailure,
        },
      });

      return invitation;
    }
  }

  private async deliverCandidateInvitationEmail(input: {
    invitationId: string;
    token: string;
    email: string;
    campaignId: string;
    campaignName: string;
    organisationName: string | null;
    expiresAt?: Date | null;
    userId: string;
    successAuditAction: string;
    failureAuditAction: string;
  }) {
    const invitationUrl = `${this.getWebAppBaseUrl()}/assessment/invitation/${encodeURIComponent(
      input.token,
    )}`;

    try {
      const deliveryResult =
        await this.emailService.sendCandidateInvitationEmail({
          to: {
            email: input.email,
            name: null,
          },
          organisationName: input.organisationName,
          campaignName: input.campaignName,
          invitationUrl,
          expiresAt: input.expiresAt,
        });

      const invitation = await this.prisma.invitation.update({
        where: {
          id: input.invitationId,
        },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.SENT,
          lastEmailSentAt: new Date(),
          lastEmailFailure: null,
        },
        include: this.getInvitationInclude(),
      });

      await this.auditService.record({
        action: input.successAuditAction,
        userId: input.userId,
        entityType: 'Invitation',
        entityId: input.invitationId,
        metadata: {
          campaignId: input.campaignId,
          email: input.email,
          emailDeliveryStatus: invitation.emailDeliveryStatus,
          lastEmailSentAt: invitation.lastEmailSentAt,
          messageId: deliveryResult.messageId ?? null,
          accepted: deliveryResult.accepted ?? [],
          rejected: deliveryResult.rejected ?? [],
        },
      });

      return {
        sent: true,
        invitation,
      };
    } catch (error) {
      const failureMessage =
        error instanceof Error
          ? error.message.slice(0, 500)
          : 'Candidate invitation email delivery failed.';

      const invitation = await this.prisma.invitation.update({
        where: {
          id: input.invitationId,
        },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.FAILED,
          lastEmailFailure: failureMessage,
        },
        include: this.getInvitationInclude(),
      });

      await this.auditService.record({
        action: input.failureAuditAction,
        userId: input.userId,
        entityType: 'Invitation',
        entityId: input.invitationId,
        metadata: {
          campaignId: input.campaignId,
          email: input.email,
          emailDeliveryStatus: invitation.emailDeliveryStatus,
          lastEmailFailure: invitation.lastEmailFailure,
        },
      });

      return {
        sent: false,
        invitation,
      };
    }
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

  private async getManageableInvitation(id: string, user: RequestUser) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
      include: this.getInvitationInclude(),
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    this.assertCanManageCampaign(user, invitation.campaign.organisationId);

    return invitation;
  }

  private getInvitationInclude() {
    return {
      campaign: {
        include: {
          organisation: true,
          assessmentForm: true,
        },
      },
      sessions: true,
    };
  }

  private assertInvitationHasNoSession(sessionCount: number) {
    if (sessionCount > 0) {
      throw new BadRequestException(
        'This invitation already has an assessment session and cannot be modified',
      );
    }
  }

  private async ensureOrganisationParticipant(input: {
    organisationId: string;
    userId: string;
    accessMode?: CandidateAccessMode;
  }) {
    const existingParticipant =
      await this.prisma.organisationParticipant.findUnique({
        where: {
          organisationId_userId: {
            organisationId: input.organisationId,
            userId: input.userId,
          },
        },
      });

    if (existingParticipant) {
      if (
        existingParticipant.status === OrganisationParticipantStatus.ARCHIVED
      ) {
        return this.prisma.organisationParticipant.update({
          where: {
            id: existingParticipant.id,
          },
          data: {
            status: OrganisationParticipantStatus.ACTIVE,
            archivedAt: null,
          },
        });
      }

      return existingParticipant;
    }

    return this.prisma.organisationParticipant.create({
      data: {
        organisationId: input.organisationId,
        userId: input.userId,
        participantType: OrganisationParticipantType.CANDIDATE,
        accessMode: input.accessMode ?? CandidateAccessMode.ONE_OFF,
        status: OrganisationParticipantStatus.ACTIVE,
      },
    });
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
}
