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
  roles?: string[];
  organisationId?: string | null;
  organisationMemberships?: {
    organisationId: string;
    role: string;
    status: string;
  }[];
};

function hasRole(user: RequestUser, role: UserRole) {
  return user.role === role || user.roles?.includes(role) === true;
}

function hasActiveOrganisationRole(
  user: RequestUser,
  organisationId: string,
  role: UserRole,
) {
  return (
    user.organisationMemberships?.some(
      (membership) =>
        membership.organisationId === organisationId &&
        membership.role === role &&
        membership.status === 'ACTIVE',
    ) === true
  );
}

function getPrimaryEmployerOrganisationId(user: RequestUser) {
  if (user.role === UserRole.EMPLOYER_ADMIN && user.organisationId) {
    return user.organisationId;
  }

  return (
    user.organisationMemberships?.find(
      (membership) =>
        membership.role === UserRole.EMPLOYER_ADMIN &&
        membership.status === 'ACTIVE',
    )?.organisationId ?? null
  );
}

@Injectable()
export class OrganisationParticipantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listParticipants(user: RequestUser) {
    const where = hasRole(user, UserRole.PLATFORM_ADMIN)
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
    const organisationId = getPrimaryEmployerOrganisationId(user);

    if (!organisationId) {
      throw new ForbiddenException('User is not attached to an organisation');
    }

    return organisationId;
  }

  private assertCanManageOrganisation(
    user: RequestUser,
    organisationId: string,
  ) {
    if (hasRole(user, UserRole.PLATFORM_ADMIN)) {
      return;
    }

    if (
      user.role === UserRole.EMPLOYER_ADMIN &&
      user.organisationId === organisationId
    ) {
      return;
    }

    if (
      hasActiveOrganisationRole(user, organisationId, UserRole.EMPLOYER_ADMIN)
    ) {
      return;
    }

    throw new ForbiddenException('Not authorised for this organisation');
  }
}
