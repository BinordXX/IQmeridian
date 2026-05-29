import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentDomain, ItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemBankService {
  constructor(private readonly prisma: PrismaService) {}

  createItem(input: {
    domain: AssessmentDomain;
    prompt: string;
    itemType: string;
    options?: unknown;
    correctAnswer?: unknown;
    difficulty?: string;
  }) {
    return this.prisma.item.create({
      data: {
        domain: input.domain,
        prompt: input.prompt,
        itemType: input.itemType,
        options: input.options as object,
        correctAnswer: input.correctAnswer as object,
        difficulty: input.difficulty,
        status: ItemStatus.DRAFT,
      },
    });
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
  ) {
    const item = await this.getItem(id);

    if (item.status !== ItemStatus.DRAFT) {
      throw new BadRequestException('Only draft items can be edited');
    }

    return this.prisma.item.update({
      where: { id },
      data: {
        prompt: input.prompt,
        itemType: input.itemType,
        options: input.options as object,
        correctAnswer: input.correctAnswer as object,
        difficulty: input.difficulty,
      },
    });
  }

  activateItem(id: string) {
    return this.prisma.item.update({
      where: { id },
      data: { status: ItemStatus.ACTIVE },
    });
  }

  retireItem(id: string) {
    return this.prisma.item.update({
      where: { id },
      data: { status: ItemStatus.RETIRED },
    });
  }

  listItems(filters: {
    domain?: AssessmentDomain;
    status?: ItemStatus;
    formId?: string;
  }) {
    return this.prisma.item.findMany({
      where: {
        domain: filters.domain,
        status: filters.status,
        formMappings: filters.formId
          ? {
              some: {
                formId: filters.formId,
              },
            }
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        formMappings: {
          include: {
            form: true,
            section: true,
          },
        },
      },
    });
  }
}