import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createConsumerSession(input: { userId: string; assessmentFormId: string }) {
    const form = await this.getUsableForm(input.assessmentFormId);

    const existing = await this.prisma.session.findFirst({
      where: {
        userId: input.userId,
        assessmentFormId: input.assessmentFormId,
        campaignId: null,
        status: {
          in: [SessionStatus.NOT_STARTED, SessionStatus.IN_PROGRESS],
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User already has an active consumer session for this form');
    }

    return this.prisma.session.create({
      data: {
        userId: input.userId,
        assessmentFormId: form.id,
        status: SessionStatus.NOT_STARTED,
      },
    });
  }

  async createSessionFromInvitation(input: {
    userId: string;
    invitationToken: string;
  }) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: input.invitationToken },
      include: {
        campaign: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation is not pending');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (!invitation.campaign.assessmentFormId) {
      throw new BadRequestException('Campaign has no assessment form assigned');
    }

    const existing = await this.prisma.session.findFirst({
      where: {
        invitationId: invitation.id,
        status: {
          in: [SessionStatus.NOT_STARTED, SessionStatus.IN_PROGRESS],
        },
      },
    });

    if (existing) {
      throw new BadRequestException('An active session already exists for this invitation');
    }

    return this.prisma.session.create({
      data: {
        userId: input.userId,
        campaignId: invitation.campaignId,
        invitationId: invitation.id,
        assessmentFormId: invitation.campaign.assessmentFormId,
        status: SessionStatus.NOT_STARTED,
      },
    });
  }

  async startSession(sessionId: string, userId: string) {
    const session = await this.getSessionForUser(sessionId, userId);

    if (session.status !== SessionStatus.NOT_STARTED) {
      throw new BadRequestException('Only not-started sessions can be started');
    }

    const firstSection = await this.prisma.assessmentSection.findFirst({
      where: { formId: session.assessmentFormId },
      orderBy: { orderIndex: 'asc' },
    });

    if (!firstSection) {
      throw new BadRequestException('Assessment form has no sections');
    }

    const now = new Date();

    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.IN_PROGRESS,
        startedAt: now,
        currentSectionId: firstSection.id,
        currentSectionOrder: firstSection.orderIndex,
        sectionStartedAt: now,
        sectionEndsAt: new Date(now.getTime() + firstSection.timeLimitSec * 1000),
      },
      include: {
        assessmentForm: {
          include: {
            sections: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        currentSection: true,
      },
    });
  }

  async resumeSession(sessionId: string, userId: string) {
    const session = await this.getSessionForUser(sessionId, userId);

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress sessions can be resumed');
    }

    return session;
  }

  async finaliseSession(sessionId: string, userId: string) {
    const session = await this.getSessionForUser(sessionId, userId);

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Session is already completed');
    }

    if (
      session.status === SessionStatus.EXPIRED ||
      session.status === SessionStatus.ABANDONED
    ) {
      throw new BadRequestException('This session cannot be finalised');
    }

    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  private async getUsableForm(assessmentFormId: string) {
    const form = await this.prisma.assessmentForm.findUnique({
      where: { id: assessmentFormId },
    });

    if (!form) {
      throw new NotFoundException('Assessment form not found');
    }

    if (!form.isActive) {
      throw new BadRequestException('Only active forms can be used');
    }

    return form;
  }

  private async getSessionForUser(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        assessmentForm: true,
        currentSection: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new BadRequestException('Session does not belong to this user');
    }

    return session;
  }
}