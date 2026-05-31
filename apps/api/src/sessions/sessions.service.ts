import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SessionStatus, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listSessions(
  user: {
    id: string;
    role: string;
    organisationId?: string | null;
  },
  filters: {
    page?: number;
    limit?: number;
    status?: SessionStatus;
    campaignId?: string;
    assessmentFormId?: string;
    userId?: string;
  } = {},
) {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 25, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.SessionWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters.assessmentFormId
      ? { assessmentFormId: filters.assessmentFormId }
      : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
  };

  if (user.role === UserRole.CANDIDATE || user.role === UserRole.CONSUMER) {
    where.userId = user.id;
  }

  if (user.role === UserRole.EMPLOYER_ADMIN) {
    if (!user.organisationId) {
      throw new BadRequestException('User is not attached to an organisation');
    }

    where.campaign = {
      organisationId: user.organisationId,
    };
  }

  const [total, data] = await this.prisma.$transaction([
    this.prisma.session.count({ where }),
    this.prisma.session.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        campaign: true,
        assessmentForm: true,
        currentSection: true,
        responses: true,
        score: true,
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

  async createConsumerSession(input: {
    userId: string;
    assessmentFormId: string;
  }) {
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
      throw new BadRequestException(
        'User already has an active consumer session for this form',
      );
    }

    const session = await this.prisma.session.create({
      data: {
        userId: input.userId,
        assessmentFormId: form.id,
        status: SessionStatus.NOT_STARTED,
      },
    });

    await this.auditService.record({
      action: 'CONSUMER_SESSION_CREATED',
      userId: input.userId,
      entityType: 'Session',
      entityId: session.id,
      metadata: {
        assessmentFormId: session.assessmentFormId,
        status: session.status,
      },
    });

    return session;
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
      throw new BadRequestException(
        'An active session already exists for this invitation',
      );
    }

    const session = await this.prisma.session.create({
      data: {
        userId: input.userId,
        campaignId: invitation.campaignId,
        invitationId: invitation.id,
        assessmentFormId: invitation.campaign.assessmentFormId,
        status: SessionStatus.NOT_STARTED,
      },
    });

    await this.auditService.record({
      action: 'INVITATION_SESSION_CREATED',
      userId: input.userId,
      entityType: 'Session',
      entityId: session.id,
      metadata: {
        campaignId: session.campaignId,
        invitationId: session.invitationId,
        assessmentFormId: session.assessmentFormId,
        status: session.status,
      },
    });

    return session;
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

    const startedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.IN_PROGRESS,
        startedAt: now,
        currentSectionId: firstSection.id,
        currentSectionOrder: firstSection.orderIndex,
        sectionStartedAt: now,
        sectionEndsAt: new Date(
          now.getTime() + firstSection.timeLimitSec * 1000,
        ),
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

    await this.auditService.record({
      action: 'SESSION_STARTED',
      userId: startedSession.userId,
      entityType: 'Session',
      entityId: startedSession.id,
      metadata: {
        campaignId: startedSession.campaignId,
        invitationId: startedSession.invitationId,
        assessmentFormId: startedSession.assessmentFormId,
        currentSectionId: startedSession.currentSectionId,
        currentSectionOrder: startedSession.currentSectionOrder,
        startedAt: startedSession.startedAt,
        sectionEndsAt: startedSession.sectionEndsAt,
      },
    });

    return startedSession;
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

    const completedAt = new Date();

    const finalisedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt,
      },
    });

    await this.auditService.record({
      action: 'SESSION_SUBMITTED',
      userId: finalisedSession.userId,
      entityType: 'Session',
      entityId: finalisedSession.id,
      metadata: {
        campaignId: finalisedSession.campaignId,
        invitationId: finalisedSession.invitationId,
        assessmentFormId: finalisedSession.assessmentFormId,
        completedAt: finalisedSession.completedAt,
        status: finalisedSession.status,
      },
    });

    return finalisedSession;
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
      throw new ForbiddenException('Session does not belong to this user');
    }

    return session;
  }
}