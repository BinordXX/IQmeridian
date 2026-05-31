import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  getCurrentUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisation: true,
      },
    });
  }

  getUsersByRole(role: UserRole) {
    return this.prisma.user.findMany({
      where: { role },
      include: { organisation: true },
    });
  }

  async getUsersByOrganisation(
    organisationId: string,
    filters: {
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where = { organisationId };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          organisation: true,
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

  async updateUserName(userId: string, name: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    await this.auditService.record({
      action: 'USER_PROFILE_UPDATED',
      userId,
      entityType: 'User',
      entityId: user.id,
      metadata: {
        name: user.name,
      },
    });

    return user;
  }
}