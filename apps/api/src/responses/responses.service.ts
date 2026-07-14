import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { FormItemMappingStatus, Prisma, SessionStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

type SaveItemResponseInput = {
  sessionId: string;
  itemId: string;
  user?: RequestUser;
  sessionAccessToken?: string;
  answer: unknown;
};

@Injectable()
export class ResponsesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async saveItemResponse(input: SaveItemResponseInput) {
    const session = await this.getSessionOrThrow(input.sessionId);

    this.assertCanWriteSession(session, input);
    this.assertSessionOpenForResponseWrite(session.status);

    const mapping = await this.prisma.formItemMapping.findFirst({
      where: {
        formId: session.assessmentFormId,
        itemId: input.itemId,
        status: FormItemMappingStatus.ACTIVE,
      },
    });

    if (!mapping) {
      throw new BadRequestException(
        'Item does not belong to the assigned assessment form',
      );
    }

    const answer = this.normaliseAnswer(input.answer);

    return this.prisma.response.upsert({
      where: {
        sessionId_itemId: {
          sessionId: input.sessionId,
          itemId: input.itemId,
        },
      },
      create: {
        sessionId: input.sessionId,
        itemId: input.itemId,
        answer,
      },
      update: {
        answer,
      },
    });
  }

  async getSessionResponses(sessionId: string, user: RequestUser) {
    const session = await this.getSessionOrThrow(sessionId);

    this.assertUserCanReadSession(session, user);

    return this.prisma.response.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getSessionResponsesWithAccessToken(
    sessionId: string,
    sessionAccessToken?: string,
  ) {
    const session = await this.getSessionOrThrow(sessionId);

    this.assertSessionAccessToken(session, sessionAccessToken);

    return this.prisma.response.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async finaliseResponseSetWithAccessToken(
    sessionId: string,
    sessionAccessToken?: string,
  ) {
    const session = await this.getSessionOrThrow(sessionId);

    this.assertSessionAccessToken(session, sessionAccessToken);
    this.assertSessionOpenForResponseWrite(session.status);

    return this.finaliseResponseSetInternal(sessionId, null);
  }

  async finaliseResponseSet(sessionId: string, user: RequestUser) {
    const session = await this.getSessionOrThrow(sessionId);

    this.assertUserCanWriteSession(session, user);
    this.assertSessionOpenForResponseWrite(session.status);

    return this.finaliseResponseSetInternal(sessionId, user.id);
  }

  private async finaliseResponseSetInternal(
    sessionId: string,
    actorUserId: string | null,
  ) {
    const now = new Date();

    const finalisedSession = await this.prisma.$transaction(async (tx) => {
      await tx.response.updateMany({
        where: {
          sessionId,
          submittedAt: null,
        },
        data: {
          submittedAt: now,
        },
      });

      return tx.session.update({
        where: {
          id: sessionId,
        },
        data: {
          status: SessionStatus.COMPLETED,
          completedAt: now,
        },
        include: {
          responses: true,
        },
      });
    });

    await this.auditService.record({
      action: 'SESSION_RESPONSES_SUBMITTED',
      userId: actorUserId ?? finalisedSession.userId,
      entityType: 'Session',
      entityId: finalisedSession.id,
      metadata: {
        campaignId: finalisedSession.campaignId,
        invitationId: finalisedSession.invitationId,
        applicantEmail: finalisedSession.applicantEmail,
        applicantName: finalisedSession.applicantName,
        assessmentFormId: finalisedSession.assessmentFormId,
        responseCount: finalisedSession.responses.length,
        completedAt: finalisedSession.completedAt,
        status: finalisedSession.status,
      },
    });

    return finalisedSession;
  }

  private async getSessionOrThrow(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        campaign: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  private assertCanWriteSession(
    session: {
      userId: string | null;
      sessionAccessTokenHash: string | null;
    },
    input: {
      user?: RequestUser;
      sessionAccessToken?: string;
    },
  ) {
    if (input.user) {
      this.assertUserCanWriteSession(session, input.user);
      return;
    }

    this.assertSessionAccessToken(session, input.sessionAccessToken);
  }

  private assertUserCanWriteSession(
    session: {
      userId: string | null;
    },
    user: RequestUser,
  ) {
    if (user.role === 'PLATFORM_ADMIN') {
      return;
    }

    if (session.userId !== user.id) {
      throw new ForbiddenException(
        'You cannot write responses for this session',
      );
    }
  }

  private assertUserCanReadSession(
    session: {
      userId: string | null;
      campaign?: { organisationId: string } | null;
    },
    user: RequestUser,
  ) {
    if (user.role === 'PLATFORM_ADMIN') {
      return;
    }

    if (
      (user.role === 'CANDIDATE' || user.role === 'CONSUMER') &&
      session.userId === user.id
    ) {
      return;
    }

    if (
      user.role === 'EMPLOYER_ADMIN' &&
      session.campaign?.organisationId === user.organisationId
    ) {
      return;
    }

    throw new ForbiddenException(
      'You cannot access responses for this session',
    );
  }

  private assertSessionOpenForResponseWrite(status: SessionStatus) {
    const closedStatuses: SessionStatus[] = [
      SessionStatus.COMPLETED,
      SessionStatus.EXPIRED,
      SessionStatus.ABANDONED,
    ];

    if (closedStatuses.includes(status)) {
      throw new BadRequestException(
        'Responses cannot be changed after session closure',
      );
    }
  }

  private assertSessionAccessToken(
    session: {
      sessionAccessTokenHash: string | null;
    },
    rawToken?: string,
  ) {
    const sessionAccessToken = rawToken?.trim();

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

  private hashSessionAccessToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private normaliseAnswer(answer: unknown): Prisma.InputJsonValue {
    if (answer === undefined || answer === null) {
      throw new BadRequestException('Answer is required');
    }

    const answerType = typeof answer;

    if (
      answerType !== 'string' &&
      answerType !== 'number' &&
      answerType !== 'boolean' &&
      answerType !== 'object'
    ) {
      throw new BadRequestException('Invalid answer format');
    }

    try {
      const serialised = JSON.stringify(answer);

      if (serialised === undefined) {
        throw new BadRequestException('Invalid answer format');
      }

      return JSON.parse(serialised) as Prisma.InputJsonValue;
    } catch {
      throw new BadRequestException('Answer must be JSON-serialisable');
    }
  }
}
