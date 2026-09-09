import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CampaignStatus,
  CandidateResultVisibility,
  Prisma,
  PsychometricScoreBand,
  UserRole,
} from '@prisma/client';

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

type CandidateResultThresholdConfig = {
  enabled: boolean;
  minimumOverallBand: PsychometricScoreBand | null;
  minimumAbstractReasoningBand: PsychometricScoreBand | null;
  minimumNumericalReasoningBand: PsychometricScoreBand | null;
  hideUnscoredFromFilteredView: boolean;
  requireNoHighSeverityValidityFlags: boolean;
};

type UpdateCandidateResultThresholdsInput =
  Partial<CandidateResultThresholdConfig>;

const DEFAULT_CANDIDATE_RESULT_THRESHOLD_CONFIG: CandidateResultThresholdConfig =
  {
    enabled: false,
    minimumOverallBand: null,
    minimumAbstractReasoningBand: null,
    minimumNumericalReasoningBand: null,
    hideUnscoredFromFilteredView: true,
    requireNoHighSeverityValidityFlags: false,
  };

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createCampaign(input: {
    name: string;
    organisationId: string;
    ownerId?: string;
    assessmentFormId?: string;
    requestingUser: RequestUser;
  }) {
    const organisationId = hasRole(
      input.requestingUser,
      UserRole.PLATFORM_ADMIN,
    )
      ? input.organisationId
      : getPrimaryEmployerOrganisationId(input.requestingUser);

    if (!organisationId) {
      throw new ForbiddenException('User is not attached to an organisation');
    }

    this.assertCanManageOrganisation(input.requestingUser, organisationId);

    if (input.assessmentFormId) {
      const form = await this.prisma.assessmentForm.findUnique({
        where: { id: input.assessmentFormId },
      });

      if (!form) {
        throw new NotFoundException('Assessment form not found');
      }

      if (!form.isActive) {
        throw new BadRequestException('Only active forms can be assigned');
      }
    }

    const ownerId =
      input.requestingUser.role === UserRole.PLATFORM_ADMIN
        ? (input.ownerId ?? input.requestingUser.id)
        : input.requestingUser.id;

    const campaign = await this.prisma.campaign.create({
      data: {
        name: input.name,
        organisationId,
        ownerId,
        assessmentFormId: input.assessmentFormId,
        candidateResultVisibility: CandidateResultVisibility.SUMMARY_ONLY,
        candidateResultThresholdConfig:
          DEFAULT_CANDIDATE_RESULT_THRESHOLD_CONFIG as Prisma.InputJsonValue,
      },
      include: {
        organisation: true,
        owner: true,
        assessmentForm: true,
      },
    });

    await this.auditService.record({
      action: 'CAMPAIGN_CREATED',
      userId: input.requestingUser.id,
      entityType: 'Campaign',
      entityId: campaign.id,
      metadata: {
        name: campaign.name,
        organisationId: campaign.organisationId,
        ownerId: campaign.ownerId,
        assessmentFormId: campaign.assessmentFormId,
        status: campaign.status,
      },
    });

    return campaign;
  }

  async findCampaignsForUser(
    user: RequestUser,
    filters: {
      page?: number;
      limit?: number;
      status?: CampaignStatus;
      organisationId?: string;
      assessmentFormId?: string;
      ownerId?: string;
    } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    let organisationId = filters.organisationId;

    if (!hasRole(user, UserRole.PLATFORM_ADMIN)) {
      const employerOrganisationId = filters.organisationId
        ? filters.organisationId
        : getPrimaryEmployerOrganisationId(user);

      if (!employerOrganisationId) {
        throw new ForbiddenException('User is not attached to an organisation');
      }

      this.assertCanManageOrganisation(user, employerOrganisationId);
      organisationId = employerOrganisationId;
    }

    const where: Prisma.CampaignWhereInput = {
      ...(organisationId ? { organisationId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.assessmentFormId
        ? { assessmentFormId: filters.assessmentFormId }
        : {}),
      ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.campaign.count({ where }),
      this.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          organisation: true,
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              organisationId: true,
            },
          },
          assessmentForm: true,
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

  async findCampaignById(id: string, user: RequestUser) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        organisation: true,
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organisationId: true,
          },
        },
        assessmentForm: true,
        invitations: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        sessions: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                organisationId: true,
              },
            },
            invitation: true,
            responses: true,
            score: true,
            psychometricScoreResult: {
              include: {
                domainScores: true,
                validityFlags: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    this.assertCanManageOrganisation(user, campaign.organisationId);

    return campaign;
  }

  async updateCampaignStatus(
    id: string,
    status: CampaignStatus,
    user: RequestUser,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    this.assertCanManageOrganisation(user, campaign.organisationId);
    this.assertValidStatusTransition(campaign.status, status);

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: { status },
    });

    await this.auditService.record({
      action: 'CAMPAIGN_STATUS_UPDATED',
      userId: user.id,
      entityType: 'Campaign',
      entityId: updatedCampaign.id,
      metadata: {
        previousStatus: campaign.status,
        newStatus: updatedCampaign.status,
        organisationId: updatedCampaign.organisationId,
        assessmentFormId: updatedCampaign.assessmentFormId,
      },
    });

    return updatedCampaign;
  }

  async updateCandidateResultVisibility(
    id: string,
    candidateResultVisibility: CandidateResultVisibility,
    user: RequestUser,
  ) {
    if (
      candidateResultVisibility !== CandidateResultVisibility.COMPLETION_ONLY &&
      candidateResultVisibility !== CandidateResultVisibility.SUMMARY_ONLY
    ) {
      throw new BadRequestException(
        'Only completion-only or limited summary candidate visibility is supported for employer campaigns.',
      );
    }

    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    this.assertCanManageOrganisation(user, campaign.organisationId);

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: {
        candidateResultVisibility,
      },
      include: {
        organisation: true,
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organisationId: true,
          },
        },
        assessmentForm: true,
      },
    });

    await this.auditService.record({
      action: 'CAMPAIGN_CANDIDATE_RESULT_VISIBILITY_UPDATED',
      userId: user.id,
      entityType: 'Campaign',
      entityId: updatedCampaign.id,
      metadata: {
        previousCandidateResultVisibility: campaign.candidateResultVisibility,
        newCandidateResultVisibility: updatedCampaign.candidateResultVisibility,
        organisationId: updatedCampaign.organisationId,
        assessmentFormId: updatedCampaign.assessmentFormId,
      },
    });

    return updatedCampaign;
  }

  async updateCandidateResultThresholds(
    id: string,
    input: UpdateCandidateResultThresholdsInput,
    user: RequestUser,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    this.assertCanManageOrganisation(user, campaign.organisationId);

    const previousConfig = this.normaliseCandidateResultThresholdConfig(
      campaign.candidateResultThresholdConfig,
    );

    const nextConfig: CandidateResultThresholdConfig = {
      ...previousConfig,
      enabled: input.enabled ?? previousConfig.enabled,
      minimumOverallBand:
        input.minimumOverallBand === undefined
          ? previousConfig.minimumOverallBand
          : input.minimumOverallBand,
      minimumAbstractReasoningBand:
        input.minimumAbstractReasoningBand === undefined
          ? previousConfig.minimumAbstractReasoningBand
          : input.minimumAbstractReasoningBand,
      minimumNumericalReasoningBand:
        input.minimumNumericalReasoningBand === undefined
          ? previousConfig.minimumNumericalReasoningBand
          : input.minimumNumericalReasoningBand,
      hideUnscoredFromFilteredView:
        input.hideUnscoredFromFilteredView ??
        previousConfig.hideUnscoredFromFilteredView,
      requireNoHighSeverityValidityFlags:
        input.requireNoHighSeverityValidityFlags ??
        previousConfig.requireNoHighSeverityValidityFlags,
    };

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: {
        candidateResultThresholdConfig: nextConfig as Prisma.InputJsonValue,
      },
      include: {
        organisation: true,
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organisationId: true,
          },
        },
        assessmentForm: true,
      },
    });

    await this.auditService.record({
      action: 'CAMPAIGN_CANDIDATE_RESULT_THRESHOLDS_UPDATED',
      userId: user.id,
      entityType: 'Campaign',
      entityId: updatedCampaign.id,
      metadata: {
        previousConfig,
        nextConfig,
        organisationId: updatedCampaign.organisationId,
        assessmentFormId: updatedCampaign.assessmentFormId,
      },
    });

    return updatedCampaign;
  }
  private normaliseCandidateResultThresholdConfig(
    value: unknown,
  ): CandidateResultThresholdConfig {
    if (!value || typeof value !== 'object') {
      return DEFAULT_CANDIDATE_RESULT_THRESHOLD_CONFIG;
    }

    const config = value as Partial<CandidateResultThresholdConfig>;

    return {
      enabled:
        config.enabled ?? DEFAULT_CANDIDATE_RESULT_THRESHOLD_CONFIG.enabled,
      minimumOverallBand:
        config.minimumOverallBand ??
        DEFAULT_CANDIDATE_RESULT_THRESHOLD_CONFIG.minimumOverallBand,
      minimumAbstractReasoningBand:
        config.minimumAbstractReasoningBand ??
        DEFAULT_CANDIDATE_RESULT_THRESHOLD_CONFIG.minimumAbstractReasoningBand,
      minimumNumericalReasoningBand:
        config.minimumNumericalReasoningBand ??
        DEFAULT_CANDIDATE_RESULT_THRESHOLD_CONFIG.minimumNumericalReasoningBand,
      hideUnscoredFromFilteredView:
        config.hideUnscoredFromFilteredView ??
        DEFAULT_CANDIDATE_RESULT_THRESHOLD_CONFIG.hideUnscoredFromFilteredView,
      requireNoHighSeverityValidityFlags:
        config.requireNoHighSeverityValidityFlags ??
        DEFAULT_CANDIDATE_RESULT_THRESHOLD_CONFIG.requireNoHighSeverityValidityFlags,
    };
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
  private assertValidStatusTransition(
    current: CampaignStatus,
    next: CampaignStatus,
  ) {
    const allowed: Record<CampaignStatus, CampaignStatus[]> = {
      DRAFT: [CampaignStatus.ACTIVE, CampaignStatus.ARCHIVED],
      ACTIVE: [CampaignStatus.CLOSED, CampaignStatus.ARCHIVED],
      CLOSED: [CampaignStatus.ARCHIVED],
      ARCHIVED: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(
        `Invalid campaign status transition from ${current} to ${next}`,
      );
    }
  }
}
