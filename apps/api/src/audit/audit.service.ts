import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  id: string;
  role: string;
  organisationId?: string | null;
};

type RecordAuditInput = {
  action: string;
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: unknown;
};

type ListAuditLogsInput = {
  user: RequestUser;
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
};

@Injectable()
export class AuditService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async record(input: RecordAuditInput) {
    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata:
          input.metadata === undefined
            ? undefined
            : this.toJsonValue(input.metadata),
      },
    });
  }

  async list(input: ListAuditLogsInput) {
    this.assertCanReadAuditLogs(input.user);

    const page = input.page ?? 1;
    const limit = Math.min(input.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(input.action ? { action: input.action } : {}),
      ...(input.entityType ? { entityType: input.entityType } : {}),
      ...(input.entityId ? { entityId: input.entityId } : {}),
      ...(input.userId ? { userId: input.userId } : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
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

  private assertCanReadAuditLogs(user: RequestUser) {
    if (user.role === 'PLATFORM_ADMIN' || user.role === 'RESEARCHER') {
      return;
    }

    throw new ForbiddenException('You cannot access audit logs');
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}