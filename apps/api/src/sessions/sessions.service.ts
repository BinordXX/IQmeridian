import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PsychometricsService } from '../psychometrics/psychometrics.service';
import {
  AssessmentDomain,
  FormItemMappingStatus,
  InvitationStatus,
  ItemStatus,
  Prisma,
  SessionStatus,
  UserRole,
  CandidateAccessMode,
  OrganisationParticipantStatus,
  OrganisationParticipantType,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

const CONSUMER_DEFAULT_ASSESSMENT_KEY = 'CONSUMER_DEFAULT_ASSESSMENT';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

type SessionActor = {
  userId?: string | null;
  sessionAccessToken?: string | null;
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
    | 'verbal_reasoning'
    | 'numerical_reasoning'
    | 'abstract_reasoning'
    | 'logical_reasoning'
    | 'analytical_problem_solving';
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
    private readonly psychometricsService: PsychometricsService,
  ) {}

  async getSessionPsychometricScore(
    sessionId: string,
    user: {
      id: string;
      role: string;
      organisationId?: string | null;
    },
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        campaign: {
          select: {
            organisationId: true,
          },
        },
        psychometricScoreResult: {
          include: {
            domainScores: {
              orderBy: { domain: 'asc' },
            },
            validityFlags: {
              orderBy: [{ severity: 'desc' }, { code: 'asc' }],
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (!this.canReadSessionPsychometricScore(session, user)) {
      throw new ForbiddenException('Session does not belong to this user');
    }

    return session.psychometricScoreResult;
  }

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
          psychometricScoreResult: {
            include: {
              domainScores: {
                orderBy: { domain: 'asc' },
              },
              validityFlags: {
                orderBy: [{ severity: 'desc' }, { code: 'asc' }],
              },
            },
          },
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

  private async resolveConsumerAssessmentFormId(assessmentFormId?: string) {
    if (assessmentFormId) {
      return assessmentFormId;
    }

    const setting = await this.prisma.consumerAssessmentDefault.findUnique({
      where: {
        key: CONSUMER_DEFAULT_ASSESSMENT_KEY,
      },
      include: {
        assessmentForm: true,
      },
    });

    if (!setting?.isEnabled || !setting.assessmentFormId) {
      throw new BadRequestException(
        'No consumer assessment is currently available.',
      );
    }

    if (!setting.assessmentForm?.isActive) {
      throw new BadRequestException(
        'The consumer assessment form is not currently active.',
      );
    }

    return setting.assessmentFormId;
  }

  async createConsumerSession(input: {
    userId: string;
    assessmentFormId?: string;
  }) {
    const assessmentFormId = await this.resolveConsumerAssessmentFormId(
      input.assessmentFormId,
    );

    const form = await this.getUsableForm(assessmentFormId);

    await this.completeTimedOutConsumerSessions(input.userId, form.id);

    const existing = await this.prisma.session.findFirst({
      where: {
        userId: input.userId,
        assessmentFormId: form.id,
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
        assessmentFormVersion: form.version,
        assessmentFormVersionLabel: form.versionLabel,
        scoringVersion: form.scoringVersion,
        reportVersion: form.reportVersion,
        formSnapshot: this.toFormSnapshot(form),
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
        assessmentFormVersion: session.assessmentFormVersion,
        assessmentFormVersionLabel: session.assessmentFormVersionLabel,
        scoringVersion: session.scoringVersion,
        reportVersion: session.reportVersion,
      },
    });

    return session;
  }

  async createSessionFromInvitation(input: {
    userId?: string;
    invitationToken: string;
    applicantName?: string;
    consentAccepted?: boolean;
  }) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: input.invitationToken },
      include: {
        campaign: {
          include: {
            assessmentForm: true,
            organisation: {
              select: {
                id: true,
                candidateAccessMode: true,
                candidateResultVisibility: true,
                candidateHistoryVisibility: true,
                reassessmentMode: true,
              },
            },
          },
        },
        candidateUser: true,
        participant: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const applicantEmail = invitation.email.trim().toLowerCase();
    const applicantName = input.applicantName?.trim() || applicantEmail;
    const isAuthenticatedCandidate = Boolean(input.userId);

    if (!isAuthenticatedCandidate && input.consentAccepted !== true) {
      throw new BadRequestException(
        'Applicant identity confirmation and consent are required.',
      );
    }

    let candidate: {
      id: string;
      email: string;
    } | null = null;

    if (input.userId) {
      candidate = await this.prisma.user.findUnique({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (!candidate) {
        throw new NotFoundException('Candidate user not found');
      }

      if (applicantEmail !== candidate.email.trim().toLowerCase()) {
        throw new ForbiddenException(
          'This invitation is assigned to a different email address',
        );
      }
    }

    if (
      invitation.status === InvitationStatus.PENDING &&
      invitation.expiresAt &&
      invitation.expiresAt < new Date()
    ) {
      const expiredInvitation = await this.prisma.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: InvitationStatus.EXPIRED,
        },
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

    if (
      invitation.status !== InvitationStatus.PENDING &&
      invitation.status !== InvitationStatus.ACCEPTED
    ) {
      throw new BadRequestException('Invitation is no longer available');
    }

    if (
      invitation.candidateUserId &&
      (!input.userId || invitation.candidateUserId !== input.userId)
    ) {
      throw new ForbiddenException(
        'This invitation has already been assigned to another candidate',
      );
    }

    if (!invitation.campaign.assessmentFormId) {
      throw new BadRequestException('Campaign has no assessment form assigned');
    }

    const form = invitation.campaign.assessmentForm;

    if (!form) {
      throw new BadRequestException('Campaign assessment form was not found');
    }

    if (!form.isActive) {
      throw new BadRequestException('Campaign assessment form is not active');
    }

    const participant =
      input.userId && candidate
        ? (invitation.participant ??
          (await this.ensureOrganisationParticipant({
            organisationId: invitation.campaign.organisationId,
            userId: input.userId,
            accessMode:
              invitation.campaign.organisation?.candidateAccessMode ??
              CandidateAccessMode.ONE_OFF,
          })))
        : invitation.participant;

    const existing = await this.prisma.session.findFirst({
      where: {
        invitationId: invitation.id,
      },
    });

    if (existing) {
      if (input.userId && existing.userId !== input.userId) {
        throw new ForbiddenException(
          'This invitation session belongs to another user',
        );
      }

      if (!input.userId && existing.userId) {
        throw new ForbiddenException(
          'This invitation has already been claimed by a candidate account',
        );
      }

      const sessionAccessToken = input.userId
        ? null
        : this.generateSessionAccessToken();

      const repairedSession = await this.prisma.session.update({
        where: {
          id: existing.id,
        },
        data: {
          ...(participant && !existing.participantId
            ? { participantId: participant.id }
            : {}),
          ...(sessionAccessToken
            ? {
                sessionAccessTokenHash:
                  this.hashSessionAccessToken(sessionAccessToken),
              }
            : {}),
        },
      });

      const wasAutoFinalised =
        await this.completeSessionIfTimedOut(repairedSession);
      const resolvedStatus = wasAutoFinalised
        ? SessionStatus.COMPLETED
        : repairedSession.status;

      return {
        sessionId: repairedSession.id,
        assessmentId: repairedSession.assessmentFormId,
        status: this.toCandidateStatus(resolvedStatus),
        sessionAccessToken,
        candidateAccessPolicy: {
          accessMode: participant?.accessMode ?? CandidateAccessMode.ONE_OFF,
          resultVisibility:
            invitation.campaign.organisation.candidateResultVisibility,
          historyVisibility:
            invitation.campaign.organisation.candidateHistoryVisibility,
          reassessmentMode: invitation.campaign.organisation.reassessmentMode,
        },
      };
    }

    if (invitation.status === InvitationStatus.PENDING) {
      const acceptedInvitation = await this.prisma.invitation.updateMany({
        where: {
          id: invitation.id,
          status: InvitationStatus.PENDING,
          OR: input.userId
            ? [
                {
                  candidateUserId: null,
                },
                {
                  candidateUserId: input.userId,
                },
              ]
            : [
                {
                  candidateUserId: null,
                },
              ],
        },
        data: input.userId
          ? {
              candidateUserId: input.userId,
              participantId: participant?.id,
              status: InvitationStatus.ACCEPTED,
              usedAt: new Date(),
            }
          : {
              status: InvitationStatus.ACCEPTED,
              usedAt: new Date(),
            },
      });

      if (acceptedInvitation.count !== 1) {
        throw new BadRequestException(
          'Invitation could not be accepted. It may have already been used.',
        );
      }

      await this.auditService.record({
        action: 'INVITATION_ACCEPTED',
        userId: input.userId ?? null,
        entityType: 'Invitation',
        entityId: invitation.id,
        metadata: {
          campaignId: invitation.campaignId,
          email: invitation.email,
          candidateUserId: input.userId ?? null,
          participantId: participant?.id ?? null,
          applicantName,
          applicantEmail,
          invitationMode: input.userId ? 'ACCOUNT' : 'TOKEN_ONLY_APPLICANT',
        },
      });
    }

    if (input.userId && invitation.status === InvitationStatus.ACCEPTED) {
      const invitationNeedsRepair =
        !invitation.participantId || !invitation.candidateUserId;

      if (invitationNeedsRepair) {
        await this.prisma.invitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            candidateUserId: input.userId,
            participantId: participant?.id,
          },
        });
      }
    }

    const sessionAccessToken = input.userId
      ? null
      : this.generateSessionAccessToken();

    const session = await this.prisma.session.create({
      data: {
        userId: input.userId ?? null,
        campaignId: invitation.campaignId,
        invitationId: invitation.id,
        participantId: participant?.id ?? null,
        applicantEmail,
        applicantName,
        consentAcceptedAt: input.consentAccepted ? new Date() : null,
        sessionAccessTokenHash: sessionAccessToken
          ? this.hashSessionAccessToken(sessionAccessToken)
          : null,
        assessmentFormId: form.id,
        assessmentFormVersion: form.version,
        assessmentFormVersionLabel: form.versionLabel,
        scoringVersion: form.scoringVersion,
        reportVersion: form.reportVersion,
        formSnapshot: this.toFormSnapshot(form),
        status: SessionStatus.NOT_STARTED,
      },
    });

    await this.auditService.record({
      action: 'INVITATION_SESSION_CREATED',
      userId: input.userId ?? null,
      entityType: 'Session',
      entityId: session.id,
      metadata: {
        campaignId: session.campaignId,
        invitationId: session.invitationId,
        participantId: session.participantId,
        applicantEmail: session.applicantEmail,
        applicantName: session.applicantName,
        invitationMode: input.userId ? 'ACCOUNT' : 'TOKEN_ONLY_APPLICANT',
        assessmentFormId: session.assessmentFormId,
        status: session.status,
        assessmentFormVersion: session.assessmentFormVersion,
        assessmentFormVersionLabel: session.assessmentFormVersionLabel,
        scoringVersion: session.scoringVersion,
        reportVersion: session.reportVersion,
        candidateAccessPolicy: {
          accessMode: participant?.accessMode ?? CandidateAccessMode.ONE_OFF,
          resultVisibility:
            invitation.campaign.organisation.candidateResultVisibility,
          historyVisibility:
            invitation.campaign.organisation.candidateHistoryVisibility,
          reassessmentMode: invitation.campaign.organisation.reassessmentMode,
        },
      },
    });

    return {
      sessionId: session.id,
      assessmentId: session.assessmentFormId,
      status: this.toCandidateStatus(session.status),
      sessionAccessToken,
      candidateAccessPolicy: {
        accessMode: participant?.accessMode ?? CandidateAccessMode.ONE_OFF,
        resultVisibility:
          invitation.campaign.organisation.candidateResultVisibility,
        historyVisibility:
          invitation.campaign.organisation.candidateHistoryVisibility,
        reassessmentMode: invitation.campaign.organisation.reassessmentMode,
      },
    };
  }

  async startSessionWithAccessToken(
    sessionId: string,
    sessionAccessToken?: string,
  ) {
    return this.startSessionForActor(sessionId, {
      sessionAccessToken,
    });
  }

  async resumeSessionWithAccessToken(
    sessionId: string,
    sessionAccessToken?: string,
  ) {
    return this.resumeSessionForActor(sessionId, {
      sessionAccessToken,
    });
  }

  async finaliseSessionWithAccessToken(
    sessionId: string,
    sessionAccessToken?: string,
  ) {
    return this.finaliseSessionForActor(sessionId, {
      sessionAccessToken,
    });
  }

  async startSession(sessionId: string, userId: string) {
    return this.startSessionForActor(sessionId, {
      userId,
    });
  }

  private async startSessionForActor(sessionId: string, actor: SessionActor) {
    const session = await this.getSessionForActor(sessionId, actor);

    if (session.status === SessionStatus.IN_PROGRESS) {
      return this.getCandidateAssessmentSessionPayload(sessionId, actor);
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
        participantId: startedSession.participantId,
        applicantEmail: startedSession.applicantEmail,
        applicantName: startedSession.applicantName,
        assessmentFormId: startedSession.assessmentFormId,
        currentSectionId: startedSession.currentSectionId,
        currentSectionOrder: startedSession.currentSectionOrder,
        startedAt: startedSession.startedAt,
        sectionEndsAt: startedSession.sectionEndsAt,
        assessmentFormVersion: startedSession.assessmentFormVersion,
        assessmentFormVersionLabel: startedSession.assessmentFormVersionLabel,
        scoringVersion: startedSession.scoringVersion,
        reportVersion: startedSession.reportVersion,
      },
    });

    return this.getCandidateAssessmentSessionPayload(sessionId, actor);
  }

  async resumeSession(sessionId: string, userId: string) {
    return this.resumeSessionForActor(sessionId, {
      userId,
    });
  }

  private async resumeSessionForActor(sessionId: string, actor: SessionActor) {
    const session = await this.getSessionForActor(sessionId, actor);

    await this.completeSessionIfTimedOut(session);

    const refreshedSession = await this.getSessionForActor(sessionId, actor);

    if (
      refreshedSession.status !== SessionStatus.NOT_STARTED &&
      refreshedSession.status !== SessionStatus.IN_PROGRESS &&
      refreshedSession.status !== SessionStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Only not-started, in-progress, or completed sessions can be resumed',
      );
    }

    return this.getCandidateAssessmentSessionPayload(sessionId, actor);
  }

  async finaliseSession(sessionId: string, userId: string) {
    return this.finaliseSessionForActor(sessionId, {
      userId,
    });
  }

  private async finaliseSessionForActor(
    sessionId: string,
    actor: SessionActor,
  ) {
    const session = await this.getSessionForActor(sessionId, actor);

    if (session.status === SessionStatus.COMPLETED) {
      const psychometricScoring = await this.scoreCompletedSessionBestEffort(
        session.id,
        session.userId,
        'ALREADY_COMPLETED',
      );

      return {
        sessionId: session.id,
        status: 'completed',
        submittedAt:
          session.completedAt?.toISOString() ?? new Date().toISOString(),
        psychometricScoring,
      };
    }

    if (session.status === SessionStatus.ABANDONED) {
      throw new BadRequestException('This session cannot be finalised');
    }

    const isTimeoutFinalisation = this.isTimedOutSession(session);
    const completedAt =
      isTimeoutFinalisation && session.sectionEndsAt
        ? session.sectionEndsAt
        : new Date();

    const finalisedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt,
      },
    });

    await this.auditService.record({
      action: isTimeoutFinalisation
        ? 'SESSION_TIMEOUT_AUTO_FINALISED'
        : 'SESSION_SUBMITTED',
      userId: finalisedSession.userId,
      entityType: 'Session',
      entityId: finalisedSession.id,
      metadata: {
        campaignId: finalisedSession.campaignId,
        invitationId: finalisedSession.invitationId,
        participantId: finalisedSession.participantId,
        applicantEmail: finalisedSession.applicantEmail,
        applicantName: finalisedSession.applicantName,
        assessmentFormId: finalisedSession.assessmentFormId,
        completedAt: finalisedSession.completedAt,
        status: finalisedSession.status,
        assessmentFormVersion: finalisedSession.assessmentFormVersion,
        assessmentFormVersionLabel: finalisedSession.assessmentFormVersionLabel,
        scoringVersion: finalisedSession.scoringVersion,
        reportVersion: finalisedSession.reportVersion,
        finalisationMode: isTimeoutFinalisation
          ? 'TIMEOUT_AUTO_FINALISED'
          : 'USER_SUBMITTED',
      },
    });

    const psychometricScoring = await this.scoreCompletedSessionBestEffort(
      finalisedSession.id,
      finalisedSession.userId,
      isTimeoutFinalisation ? 'TIMEOUT_AUTO_FINALISED' : 'USER_SUBMITTED',
    );

    return {
      sessionId: finalisedSession.id,
      status: 'completed',
      submittedAt: completedAt.toISOString(),
      psychometricScoring,
    };
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

  private async getCandidateAssessmentSessionPayload(
    sessionId: string,
    actor: SessionActor,
  ): Promise<CandidateAssessmentSessionPayload> {
    let session = await this.prisma.session.findUnique({
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

    this.assertActorCanAccessSession(session, actor);

    if (this.isTimedOutSession(session)) {
      const completedSession = await this.completeTimedOutSession(session);

      session = {
        ...session,
        status: completedSession.status,
        completedAt: completedSession.completedAt,
        updatedAt: completedSession.updatedAt,
      };
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
      candidateName:
        session.applicantName ??
        session.user?.name ??
        session.applicantEmail ??
        session.user?.email ??
        undefined,
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
      case AssessmentDomain.VERBAL_REASONING:
        return 'verbal_reasoning';

      case AssessmentDomain.NUMERICAL_REASONING:
        return 'numerical_reasoning';

      case AssessmentDomain.ABSTRACT_REASONING:
        return 'abstract_reasoning';

      case AssessmentDomain.LOGICAL_REASONING:
        return 'logical_reasoning';

      case AssessmentDomain.ANALYTICAL_PROBLEM_SOLVING:
        return 'analytical_problem_solving';

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
  private toFormSnapshot(form: {
    id: string;
    name: string;
    version: number;
    versionLabel: string | null;
    scoringVersion: number;
    reportVersion: number;
    domainBlueprint: Prisma.JsonValue | null;
    timingRules: Prisma.JsonValue | null;
    pilotStatus: string;
    isLocked: boolean;
  }): Prisma.InputJsonObject {
    return {
      id: form.id,
      name: form.name,
      version: form.version,
      versionLabel: form.versionLabel,
      scoringVersion: form.scoringVersion,
      reportVersion: form.reportVersion,
      domainBlueprint: this.toInputJsonValue(form.domainBlueprint),
      timingRules: this.toInputJsonValue(form.timingRules),
      pilotStatus: form.pilotStatus,
      isLocked: form.isLocked,
      capturedAt: new Date().toISOString(),
    };
  }

  private toInputJsonValue(
    value: Prisma.JsonValue | null,
  ): Prisma.InputJsonValue | null {
    if (value === null) {
      return null;
    }

    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
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

  private async getSessionForActor(sessionId: string, actor: SessionActor) {
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

    this.assertActorCanAccessSession(session, actor);

    return session;
  }

  private assertActorCanAccessSession(
    session: {
      userId: string | null;
      sessionAccessTokenHash: string | null;
    },
    actor: SessionActor,
  ) {
    if (actor.userId) {
      if (session.userId !== actor.userId) {
        throw new ForbiddenException('Session does not belong to this user');
      }

      return;
    }

    const sessionAccessToken = actor.sessionAccessToken?.trim();

    if (!sessionAccessToken) {
      throw new ForbiddenException(
        'Assessment session access token is required',
      );
    }

    if (!session.sessionAccessTokenHash) {
      throw new ForbiddenException(
        'This session does not support token access',
      );
    }

    if (
      this.hashSessionAccessToken(sessionAccessToken) !==
      session.sessionAccessTokenHash
    ) {
      throw new ForbiddenException(
        'Assessment session access token is invalid',
      );
    }
  }

  private isTimedOutSession(session: {
    status: SessionStatus;
    sectionEndsAt: Date | null;
  }) {
    const sectionEndsAt = session.sectionEndsAt;

    return (
      session.status === SessionStatus.IN_PROGRESS &&
      sectionEndsAt !== null &&
      sectionEndsAt <= new Date()
    );
  }

  private async completeSessionIfTimedOut(session: {
    id: string;
    userId: string | null;
    campaignId: string | null;
    invitationId: string | null;
    assessmentFormId: string;
    assessmentFormVersion: number;
    assessmentFormVersionLabel: string | null;
    scoringVersion: number;
    reportVersion: number;
    status: SessionStatus;
    sectionEndsAt: Date | null;
  }) {
    if (!this.isTimedOutSession(session)) {
      return false;
    }

    await this.completeTimedOutSession(session);

    return true;
  }

  private async completeTimedOutConsumerSessions(
    userId: string,
    assessmentFormId: string,
  ) {
    const timedOutSessions = await this.prisma.session.findMany({
      where: {
        userId,
        assessmentFormId,
        campaignId: null,
        status: SessionStatus.IN_PROGRESS,
        sectionEndsAt: {
          lte: new Date(),
        },
      },
    });

    for (const session of timedOutSessions) {
      await this.completeTimedOutSession(session);
    }
  }

  private async completeTimedOutSession(session: {
    id: string;
    userId: string | null;
    campaignId: string | null;
    invitationId: string | null;
    assessmentFormId: string;
    assessmentFormVersion: number;
    assessmentFormVersionLabel: string | null;
    scoringVersion: number;
    reportVersion: number;
    sectionEndsAt: Date | null;
  }) {
    const completedAt = session.sectionEndsAt ?? new Date();

    const updatedSession = await this.prisma.session.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt,
      },
    });

    await this.auditService.record({
      action: 'SESSION_TIMEOUT_AUTO_FINALISED',
      userId: updatedSession.userId,
      entityType: 'Session',
      entityId: updatedSession.id,
      metadata: {
        campaignId: updatedSession.campaignId,
        invitationId: updatedSession.invitationId,
        participantId: updatedSession.participantId,
        assessmentFormId: updatedSession.assessmentFormId,
        completedAt: updatedSession.completedAt,
        status: updatedSession.status,
        assessmentFormVersion: updatedSession.assessmentFormVersion,
        assessmentFormVersionLabel: updatedSession.assessmentFormVersionLabel,
        scoringVersion: updatedSession.scoringVersion,
        reportVersion: updatedSession.reportVersion,
        finalisationMode: 'TIMEOUT_AUTO_FINALISED',
      },
    });
    await this.scoreCompletedSessionBestEffort(
      updatedSession.id,
      updatedSession.userId,
      'TIMEOUT_AUTO_FINALISED',
    );
    return updatedSession;
  }

  private async scoreCompletedSessionBestEffort(
    sessionId: string,
    userId: string | null,
    trigger: 'USER_SUBMITTED' | 'TIMEOUT_AUTO_FINALISED' | 'ALREADY_COMPLETED',
  ) {
    const existingScore = await this.prisma.psychometricScoreResult.findUnique({
      where: { sessionId },
      select: {
        id: true,
        scoringStatus: true,
        modelVersion: true,
        generatedAt: true,
      },
    });

    if (existingScore) {
      return {
        status: 'already_scored',
        scoreResultId: existingScore.id,
        scoringStatus: existingScore.scoringStatus,
        modelVersion: existingScore.modelVersion,
        generatedAt: existingScore.generatedAt.toISOString(),
      };
    }

    try {
      const scoreResult =
        await this.psychometricsService.scoreCompletedSession(sessionId);

      const typedScoreResult = scoreResult as {
        id?: string;
        scoringStatus?: string;
        modelVersion?: string;
        generatedAt?: Date | string;
      };

      await this.auditService.record({
        action: 'SESSION_PSYCHOMETRIC_AUTO_SCORE_COMPLETED',
        userId,
        entityType: 'Session',
        entityId: sessionId,
        metadata: {
          trigger,
          scoreResultId: typedScoreResult.id ?? null,
          scoringStatus: typedScoreResult.scoringStatus ?? null,
          modelVersion: typedScoreResult.modelVersion ?? null,
          generatedAt: typedScoreResult.generatedAt ?? null,
        },
      });

      return {
        status: 'scored',
        scoreResultId: typedScoreResult.id ?? null,
        scoringStatus: typedScoreResult.scoringStatus ?? null,
        modelVersion: typedScoreResult.modelVersion ?? null,
      };
    } catch (error) {
      await this.auditService.record({
        action: 'SESSION_PSYCHOMETRIC_AUTO_SCORE_FAILED',
        userId,
        entityType: 'Session',
        entityId: sessionId,
        metadata: {
          trigger,
          message:
            error instanceof Error
              ? error.message
              : 'Unknown psychometric scoring error',
        },
      });

      return {
        status: 'failed',
        message:
          error instanceof Error
            ? error.message
            : 'Unknown psychometric scoring error',
      };
    }
  }
  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private getStringValue(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private canReadSessionPsychometricScore(
    session: {
      userId: string | null;
      campaign: {
        organisationId: string | null;
      } | null;
    },
    user: {
      id: string;
      role: string;
      organisationId?: string | null;
    },
  ) {
    if (user.role === 'PLATFORM_ADMIN' || user.role === 'RESEARCHER') {
      return true;
    }

    if (
      (user.role === 'CONSUMER' || user.role === 'CANDIDATE') &&
      session.userId === user.id
    ) {
      return true;
    }

    if (
      user.role === 'EMPLOYER_ADMIN' &&
      session.campaign?.organisationId &&
      user.organisationId === session.campaign.organisationId
    ) {
      return true;
    }

    return false;
  }
  private generateSessionAccessToken() {
    return randomBytes(32).toString('hex');
  }

  private hashSessionAccessToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
