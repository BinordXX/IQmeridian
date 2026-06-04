import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentDomain,
  FormItemMappingStatus,
  ItemStatus,
  Prisma,
  SessionStatus,
  UserRole,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

type CandidateItemOption = {
  optionId: string;
  label: string;
  text?: string;
  imageUrl?: string;
};

type CandidateSafeAssessmentItem = {
  itemId: string;
  sectionId: string;
  itemType:
    | 'abstract_reasoning'
    | 'numerical_reasoning'
    | 'verbal_reasoning'
    | 'situational_judgement';
  position: number;
  stem: string;
  prompt?: string;
  options: CandidateItemOption[];
  timeLimitSeconds?: number;
};

type CandidateAssessmentSection = {
  sectionId: string;
  title: string;
  instructions: string;
  position: number;
  itemCount: number;
  timeLimitSeconds?: number;
  items: CandidateSafeAssessmentItem[];
};

type CandidateAssessmentSessionPayload = {
  sessionId: string;
  assessmentId: string;
  assessmentTitle: string;
  candidateName?: string;
  status:
    | 'not_started'
    | 'ready'
    | 'active'
    | 'paused'
    | 'section_ended'
    | 'submitted'
    | 'completed'
    | 'expired'
    | 'cancelled';
  startedAt?: string;
  expiresAt?: string;
  serverNow: string;
  timing: {
    serverNow: string;
    expiresAt?: string;
    sectionExpiresAt?: string;
    remainingSeconds?: number;
    sectionRemainingSeconds?: number;
  };
  currentSectionId?: string;
  currentItemId?: string;
  sections: CandidateAssessmentSection[];
};

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listSessions(
    user: RequestUser,
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
        throw new BadRequestException(
          'User is not attached to an organisation',
        );
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
      return {
        sessionId: existing.id,
        assessmentId: existing.assessmentFormId,
        status: this.toCandidateStatus(existing.status),
      };
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

    return {
      sessionId: session.id,
      assessmentId: session.assessmentFormId,
      status: this.toCandidateStatus(session.status),
    };
  }

  async startSession(sessionId: string, userId: string) {
    const session = await this.getSessionForUser(sessionId, userId);

    if (session.status === SessionStatus.IN_PROGRESS) {
      return this.getCandidateAssessmentSessionPayload(sessionId, userId);
    }

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

    return this.getCandidateAssessmentSessionPayload(sessionId, userId);
  }

  async resumeSession(sessionId: string, userId: string) {
    const session = await this.getSessionForUser(sessionId, userId);

    if (
      session.status !== SessionStatus.NOT_STARTED &&
      session.status !== SessionStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Only not-started or in-progress sessions can be resumed',
      );
    }

    return this.getCandidateAssessmentSessionPayload(sessionId, userId);
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

    return {
      sessionId: finalisedSession.id,
      status: 'completed',
      submittedAt: completedAt.toISOString(),
    };
  }

  private async getCandidateAssessmentSessionPayload(
    sessionId: string,
    userId: string,
  ): Promise<CandidateAssessmentSessionPayload> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
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

    const sections = await this.prisma.assessmentSection.findMany({
      where: {
        formId: session.assessmentFormId,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    const mappings = await this.prisma.formItemMapping.findMany({
      where: {
        formId: session.assessmentFormId,
        status: FormItemMappingStatus.ACTIVE,
        item: {
          status: ItemStatus.ACTIVE,
        },
      },
      orderBy: {
        orderIndex: 'asc',
      },
      include: {
        item: true,
      },
    });

    const candidateSections: CandidateAssessmentSection[] = sections.map(
      (section, sectionIndex) => {
        const sectionMappings = mappings.filter(
          (mapping) => mapping.sectionId === section.id,
        );

        const items: CandidateSafeAssessmentItem[] = sectionMappings.map(
          (mapping, itemIndex) => ({
            itemId: mapping.itemId,
            sectionId: section.id,
            itemType: this.toCandidateItemType(mapping.item.domain),
            position: itemIndex + 1,
            stem: mapping.item.prompt,
            prompt: mapping.item.prompt,
            options: this.toCandidateOptions(mapping.item.options),
            timeLimitSeconds: section.timeLimitSec,
          }),
        );

        return {
          sectionId: section.id,
          title: section.title,
          instructions: '',
          position: sectionIndex + 1,
          itemCount: items.length,
          timeLimitSeconds: section.timeLimitSec,
          items,
        };
      },
    );

    const currentSection =
      sections.find((section) => section.id === session.currentSectionId) ??
      sections[0];

    const currentItemId = currentSection
      ? candidateSections.find(
          (section) => section.sectionId === currentSection.id,
        )?.items[0]?.itemId
      : undefined;

    const serverNow = new Date();
    const sectionRemainingSeconds = session.sectionEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (session.sectionEndsAt.getTime() - serverNow.getTime()) / 1000,
          ),
        )
      : undefined;

    return {
      sessionId: session.id,
      assessmentId: session.assessmentFormId,
      assessmentTitle: session.assessmentForm.name,
      candidateName: session.user.name ?? session.user.email,
      status: this.toCandidateStatus(session.status),
      startedAt: session.startedAt?.toISOString(),
      expiresAt: session.sectionEndsAt?.toISOString(),
      serverNow: serverNow.toISOString(),
      timing: {
        serverNow: serverNow.toISOString(),
        expiresAt: session.sectionEndsAt?.toISOString(),
        sectionExpiresAt: session.sectionEndsAt?.toISOString(),
        remainingSeconds: sectionRemainingSeconds,
        sectionRemainingSeconds,
      },
      currentSectionId: session.currentSectionId ?? currentSection?.id,
      currentItemId,
      sections: candidateSections,
    };
  }

  private toCandidateOptions(options: unknown): CandidateItemOption[] {
    if (!Array.isArray(options)) {
      return [];
    }

    return options.map((option, index) => {
      if (typeof option === 'string') {
        return {
          optionId: option,
          label: option,
          text: option,
        };
      }

      if (this.isRecord(option)) {
        const optionId =
          this.getStringValue(option.optionId) ??
          this.getStringValue(option.id) ??
          String.fromCharCode(65 + index);

        const label =
          this.getStringValue(option.label) ??
          this.getStringValue(option.text) ??
          optionId;

        return {
          optionId,
          label,
          text: this.getStringValue(option.text) ?? label,
          imageUrl: this.getStringValue(option.imageUrl),
        };
      }

      const fallback = String(option);

      return {
        optionId: fallback,
        label: fallback,
        text: fallback,
      };
    });
  }

  private toCandidateItemType(
    domain: AssessmentDomain,
  ): CandidateSafeAssessmentItem['itemType'] {
    switch (domain) {
      case AssessmentDomain.ABSTRACT_REASONING:
        return 'abstract_reasoning';

      case AssessmentDomain.NUMERICAL_REASONING:
        return 'numerical_reasoning';

      default:
        return 'abstract_reasoning';
    }
  }

  private toCandidateStatus(
    status: SessionStatus,
  ): CandidateAssessmentSessionPayload['status'] {
    switch (status) {
      case SessionStatus.NOT_STARTED:
        return 'not_started';

      case SessionStatus.IN_PROGRESS:
        return 'active';

      case SessionStatus.COMPLETED:
        return 'completed';

      case SessionStatus.EXPIRED:
        return 'expired';

      case SessionStatus.ABANDONED:
        return 'cancelled';

      default:
        return 'cancelled';
    }
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

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private getStringValue(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}
