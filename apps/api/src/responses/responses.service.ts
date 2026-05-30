import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormItemMappingStatus, Prisma, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

type SaveItemResponseInput = {
  sessionId: string;
  itemId: string;
  user: RequestUser;
  answer: unknown;
};

@Injectable()
export class ResponsesService {
  constructor(private readonly prisma: PrismaService) {}

  async saveItemResponse(input: SaveItemResponseInput) {
    const session = await this.getSessionOrThrow(input.sessionId);

    this.assertUserCanWriteSession(session, input.user);
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

  async finaliseResponseSet(sessionId: string, user: RequestUser) {
    const session = await this.getSessionOrThrow(sessionId);

    this.assertUserCanWriteSession(session, user);
    this.assertSessionOpenForResponseWrite(session.status);

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
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

  private assertUserCanWriteSession(
    session: {
      userId: string;
    },
    user: RequestUser,
  ) {
    if (user.role === 'PLATFORM_ADMIN') {
      return;
    }

    if (session.userId !== user.id) {
      throw new ForbiddenException('You cannot write responses for this session');
    }
  }

  private assertUserCanReadSession(
    session: {
      userId: string;
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

    throw new ForbiddenException('You cannot access responses for this session');
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