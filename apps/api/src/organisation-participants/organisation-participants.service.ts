import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganisationParticipantStatus, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

@Injectable()
export class OrganisationParticipantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listParticipants(user: RequestUser) {
    const where =
      user.role === UserRole.PLATFORM_ADMIN
        ? {}
        : {
            organisationId: this.requireEmployerOrganisationId(user),
          };

    return this.prisma.organisationParticipant.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
        _count: {
          select: {
            invitations: true,
            sessions: true,
          },
        },
      },
    });
  }

  async updateParticipantStatus(
    id: string,
    input: {
      status: OrganisationParticipantStatus;
    },
    user: RequestUser,
  ) {
    const participant = await this.prisma.organisationParticipant.findUnique({
      where: {
        id,
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Organisation participant not found');
    }

    this.assertCanManageOrganisation(user, participant.organisationId);

    const previousStatus = participant.status;

    const updatedParticipant = await this.prisma.organisationParticipant.update(
      {
        where: {
          id,
        },
        data: {
          status: input.status,
          archivedAt:
            input.status === OrganisationParticipantStatus.ARCHIVED
              ? new Date()
              : null,
        },
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },
          _count: {
            select: {
              invitations: true,
              sessions: true,
            },
          },
        },
      },
    );

    await this.auditService.record({
      action: 'ORGANISATION_PARTICIPANT_STATUS_UPDATED',
      userId: user.id,
      entityType: 'OrganisationParticipant',
      entityId: updatedParticipant.id,
      metadata: {
        organisationId: updatedParticipant.organisationId,
        userId: updatedParticipant.userId,
        email: updatedParticipant.user.email,
        previousStatus,
        status: updatedParticipant.status,
      },
    });

    return updatedParticipant;
  }

  private requireEmployerOrganisationId(user: RequestUser) {
    if (!user.organisationId) {
      throw new ForbiddenException('User is not attached to an organisation');
    }

    return user.organisationId;
  }

  private assertCanManageOrganisation(
    user: RequestUser,
    organisationId: string,
  ) {
    if (user.role === UserRole.PLATFORM_ADMIN) {
      return;
    }

    if (
      user.role === UserRole.EMPLOYER_ADMIN &&
      user.organisationId === organisationId
    ) {
      return;
    }

    throw new ForbiddenException('Not authorised for this organisation');
  }
}
