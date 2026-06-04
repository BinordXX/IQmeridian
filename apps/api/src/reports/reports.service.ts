import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportVisibility, SessionStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

type GenerateReportInput = {
  sessionId: string;
  visibility: ReportVisibility;
  user: RequestUser;
};

const REPORT_VERSION = 1;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async generateReport(input: GenerateReportInput) {
    const session = await this.getSessionForReport(input.sessionId);

    this.assertCanGenerateReport(session, input.visibility, input.user);

    if (session.status !== SessionStatus.COMPLETED) {
      throw new BadRequestException('Only completed sessions can be reported');
    }

    if (!session.score) {
      throw new BadRequestException(
        'Cannot generate report before scoring has been completed',
      );
    }

    const payload =
      input.visibility === ReportVisibility.EMPLOYER
        ? this.buildEmployerReportPayload(session)
        : this.buildCandidateReportPayload(session);

    const metadata: Prisma.InputJsonObject = {
      reportVersion: REPORT_VERSION,
      visibility: input.visibility,
      generatedFromScoreId: session.score.id,
      generatedFromScoringVersion: session.score.scoringVersion,
      generatedAt: new Date().toISOString(),
      sessionId: session.id,
      assessmentFormId: session.assessmentFormId,
      campaignId: session.campaignId,
    };

    const report = await this.prisma.report.upsert({
      where: {
        sessionId_visibility: {
          sessionId: input.sessionId,
          visibility: input.visibility,
        },
      },
      create: {
        sessionId: input.sessionId,
        scoreId: session.score.id,
        scoreSnapshot: this.toJsonObject(session.score),
        subjectUserId: session.userId,
        visibility: input.visibility,
        summary: payload,
        metadata,
        reportVersion: REPORT_VERSION,
      },
      update: {
        scoreId: session.score.id,
        scoreSnapshot: this.toJsonObject(session.score),
        subjectUserId: session.userId,
        summary: payload,
        metadata,
        reportVersion: REPORT_VERSION,
      },
      include: {
        session: {
          include: {
            user: true,
            campaign: true,
          },
        },
      },
    });

    await this.auditService.record({
      action: 'REPORT_GENERATED',
      userId: input.user.id,
      entityType: 'Report',
      entityId: report.id,
      metadata: {
        sessionId: report.sessionId,
        visibility: report.visibility,
        reportVersion: report.reportVersion,
        subjectUserId: report.subjectUserId,
        scoreId: report.scoreId,
      },
    });

    return report;
  }

  async listReports(
    filters: {
      page?: number;
      limit?: number;
      visibility?: ReportVisibility;
      sessionId?: string;
      subjectUserId?: string;
      scoreId?: string;
    },
    user: RequestUser,
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {
      ...(filters.visibility ? { visibility: filters.visibility } : {}),
      ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
      ...(filters.subjectUserId
        ? { subjectUserId: filters.subjectUserId }
        : {}),
      ...(filters.scoreId ? { scoreId: filters.scoreId } : {}),
    };

    if (user.role === 'CANDIDATE' || user.role === 'CONSUMER') {
      where.session = {
        userId: user.id,
      };
    }

    if (user.role === 'EMPLOYER_ADMIN') {
      if (!user.organisationId) {
        throw new ForbiddenException('User is not attached to an organisation');
      }

      where.visibility = ReportVisibility.EMPLOYER;
      where.session = {
        campaign: {
          organisationId: user.organisationId,
        },
      };
    }

    if (user.role === 'RESEARCHER') {
      where.visibility = ReportVisibility.INTERNAL;
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          session: {
            include: {
              user: true,
              campaign: true,
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

  async getReportById(id: string, user: RequestUser) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            campaign: true,
            user: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    this.assertCanReadReport(report, user);

    return report;
  }

  async getReportBySessionAndVisibility(
    sessionId: string,
    visibility: ReportVisibility,
    user: RequestUser,
  ) {
    if (!Object.values(ReportVisibility).includes(visibility)) {
      throw new BadRequestException('Invalid report visibility');
    }

    const report = await this.prisma.report.findUnique({
      where: {
        sessionId_visibility: {
          sessionId,
          visibility,
        },
      },
      include: {
        session: {
          include: {
            campaign: true,
            user: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    this.assertCanReadReport(report, user);

    return report;
  }

  private async getSessionForReport(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        campaign: true,
        assessmentForm: true,
        score: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  private buildCandidateReportPayload(
    session: Awaited<ReturnType<ReportsService['getSessionForReport']>>,
  ): Prisma.InputJsonObject {
    if (!session.score) {
      throw new BadRequestException('Score not found');
    }

    return {
      audience: ReportVisibility.CANDIDATE,
      candidate: {
        id: session.user.id,
        name: session.user.name,
      },
      result: {
        overallBand: session.score.overallBand,
        overallComposite: session.score.overallComposite,
        abstractBand: session.score.abstractBand,
        numericalBand: session.score.numericalBand,
        domainScores: session.score.domainScores,
      },
      interpretation: {
        summary:
          'This report presents the candidate-facing interpretation of completed assessment performance.',
        note: 'Scores are presented as performance bands and domain indicators rather than as an IQ diagnosis.',
      },
      nextSteps: [
        'Review domain-level strengths and weaknesses.',
        'Use the result as one part of a broader development or selection discussion.',
      ],
    };
  }

  private buildEmployerReportPayload(
    session: Awaited<ReturnType<ReportsService['getSessionForReport']>>,
  ): Prisma.InputJsonObject {
    if (!session.score) {
      throw new BadRequestException('Score not found');
    }

    return {
      audience: ReportVisibility.EMPLOYER,
      candidate: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      campaign: session.campaign
        ? {
            id: session.campaign.id,
            name: session.campaign.name,
            organisationId: session.campaign.organisationId,
          }
        : null,
      result: {
        overallRawScore: session.score.overallRawScore,
        overallMaxScore: session.score.overallMaxScore,
        overallComposite: session.score.overallComposite,
        overallBand: session.score.overallBand,
        abstractRawScore: session.score.abstractRawScore,
        abstractMaxScore: session.score.abstractMaxScore,
        abstractBand: session.score.abstractBand,
        numericalRawScore: session.score.numericalRawScore,
        numericalMaxScore: session.score.numericalMaxScore,
        numericalBand: session.score.numericalBand,
        domainScores: session.score.domainScores,
      },
      interpretation: {
        summary:
          'This employer-facing report supports structured review of assessment performance within a campaign context.',
        caution:
          'The result should inform, not replace, broader hiring judgement and role-specific evidence.',
      },
      scoring: {
        scoringVersion: session.score.scoringVersion,
        scoringMetadata: session.score.scoringMetadata,
      },
    };
  }

  private assertCanGenerateReport(
    session: {
      userId: string;
      campaign?: { organisationId: string } | null;
    },
    visibility: ReportVisibility,
    user: RequestUser,
  ) {
    if (user.role === 'PLATFORM_ADMIN') {
      return;
    }

    if (
      visibility === ReportVisibility.CANDIDATE &&
      (user.role === 'CANDIDATE' || user.role === 'CONSUMER') &&
      session.userId === user.id
    ) {
      return;
    }

    if (
      visibility === ReportVisibility.EMPLOYER &&
      user.role === 'EMPLOYER_ADMIN' &&
      session.campaign?.organisationId === user.organisationId
    ) {
      return;
    }

    throw new ForbiddenException('You cannot generate this report');
  }

  private assertCanReadReport(
    report: {
      visibility: ReportVisibility;
      subjectUserId: string | null;
      session: {
        userId: string;
        campaign?: { organisationId: string } | null;
      };
    },
    user: RequestUser,
  ) {
    if (user.role === 'PLATFORM_ADMIN') {
      return;
    }

    if (
      report.visibility === ReportVisibility.CANDIDATE &&
      user.role === 'CANDIDATE' &&
      report.session.userId === user.id
    ) {
      return;
    }

    if (
      report.visibility === ReportVisibility.CONSUMER &&
      user.role === 'CONSUMER' &&
      report.session.userId === user.id
    ) {
      return;
    }

    if (
      report.visibility === ReportVisibility.EMPLOYER &&
      user.role === 'EMPLOYER_ADMIN' &&
      report.session.campaign?.organisationId === user.organisationId
    ) {
      return;
    }

    if (
      user.role === 'RESEARCHER' &&
      report.visibility === ReportVisibility.INTERNAL
    ) {
      return;
    }

    throw new ForbiddenException('You cannot access this report');
  }

  private toJsonObject(value: unknown): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
  }
}
