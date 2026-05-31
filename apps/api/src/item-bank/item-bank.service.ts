import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentDomain, ItemStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemBankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createItem(
    input: {
      domain: AssessmentDomain;
      prompt: string;
      itemType: string;
      options?: unknown;
      correctAnswer?: unknown;
      difficulty?: string;
    },
    actorUserId: string,
  ) {
    const item = await this.prisma.item.create({
      data: {
        domain: input.domain,
        prompt: input.prompt,
        itemType: input.itemType,
        options: this.toOptionalJsonValue(input.options),
        correctAnswer: this.toOptionalJsonValue(input.correctAnswer),
        difficulty: input.difficulty,
        status: ItemStatus.DRAFT,
      },
    });

    await this.auditService.record({
      action: 'ITEM_CREATED',
      userId: actorUserId,
      entityType: 'Item',
      entityId: item.id,
      metadata: {
        domain: item.domain,
        itemType: item.itemType,
        difficulty: item.difficulty,
        status: item.status,
        version: item.version,
      },
    });

    return item;
  }

  async getItem(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        formMappings: {
          include: {
            form: true,
            section: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return item;
  }

  async updateDraftItem(
    id: string,
    input: {
      prompt?: string;
      itemType?: string;
      options?: unknown;
      correctAnswer?: unknown;
      difficulty?: string;
    },
    actorUserId: string,
  ) {
    const existingItem = await this.getItem(id);

    if (existingItem.status !== ItemStatus.DRAFT) {
      throw new BadRequestException('Only draft items can be edited');
    }

    const item = await this.prisma.item.update({
      where: { id },
      data: {
        prompt: input.prompt,
        itemType: input.itemType,
        options: this.toOptionalJsonValue(input.options),
        correctAnswer: this.toOptionalJsonValue(input.correctAnswer),
        difficulty: input.difficulty,
      },
    });

    await this.auditService.record({
      action: 'ITEM_DRAFT_UPDATED',
      userId: actorUserId,
      entityType: 'Item',
      entityId: item.id,
      metadata: {
        domain: item.domain,
        itemType: item.itemType,
        difficulty: item.difficulty,
        status: item.status,
        version: item.version,
      },
    });

    return item;
  }

  async activateItem(id: string, actorUserId: string) {
    await this.getItem(id);

    const item = await this.prisma.item.update({
      where: { id },
      data: { status: ItemStatus.ACTIVE },
    });

    await this.auditService.record({
      action: 'ITEM_ACTIVATED',
      userId: actorUserId,
      entityType: 'Item',
      entityId: item.id,
      metadata: {
        domain: item.domain,
        itemType: item.itemType,
        difficulty: item.difficulty,
        status: item.status,
        version: item.version,
      },
    });

    return item;
  }

  async retireItem(id: string, actorUserId: string) {
    await this.getItem(id);

    const item = await this.prisma.item.update({
      where: { id },
      data: { status: ItemStatus.RETIRED },
    });

    await this.auditService.record({
      action: 'ITEM_RETIRED',
      userId: actorUserId,
      entityType: 'Item',
      entityId: item.id,
      metadata: {
        domain: item.domain,
        itemType: item.itemType,
        difficulty: item.difficulty,
        status: item.status,
        version: item.version,
      },
    });

    return item;
  }

async listItems(filters: {
  domain?: AssessmentDomain;
  status?: ItemStatus;
  formId?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 25, 100);
  const skip = (page - 1) * limit;

  const where = {
    domain: filters.domain,
    status: filters.status,
    formMappings: filters.formId
      ? {
          some: {
            formId: filters.formId,
          },
        }
      : undefined,
  };

  const [total, data] = await this.prisma.$transaction([
    this.prisma.item.count({ where }),
    this.prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        formMappings: {
          include: {
            form: true,
            section: true,
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

  private toOptionalJsonValue(
    value: unknown,
  ): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
    } catch {
      throw new BadRequestException('Value must be JSON-serialisable');
    }
  }
}