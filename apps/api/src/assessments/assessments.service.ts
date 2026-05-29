import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssessmentDomain, AssessmentSectionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  createForm(input: {
    name: string;
    version?: number;
    isActive?: boolean;
    sections?: {
      type: AssessmentSectionType;
      domain: AssessmentDomain;
      title: string;
      timeLimitSec: number;
      orderIndex: number;
    }[];
  }) {
    return this.prisma.assessmentForm.create({
      data: {
        name: input.name,
        version: input.version ?? 1,
        isActive: input.isActive ?? false,
        sections: input.sections
          ? {
              create: input.sections,
            }
          : undefined,
      },
      include: {
        sections: true,
      },
    });
  }

  findActiveForms() {
    return this.prisma.assessmentForm.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        sections: true,
        items: {
          include: {
            item: true,
            section: true,
          },
        },
      },
    });
  }

  async findFormById(id: string) {
    const form = await this.prisma.assessmentForm.findUnique({
      where: { id },
      include: {
        sections: true,
        items: {
          include: {
            item: true,
            section: true,
          },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Assessment form not found');
    }

    return form;
  }

  async setFormActive(id: string, isActive: boolean) {
    await this.findFormById(id);

    return this.prisma.assessmentForm.update({
      where: { id },
      data: { isActive },
    });
  }

  async createNextVersion(id: string) {
    const existing = await this.findFormById(id);

    return this.prisma.assessmentForm.create({
      data: {
        name: existing.name,
        version: existing.version + 1,
        isActive: false,
        sections: {
          create: existing.sections.map((section) => ({
            type: section.type,
            domain: section.domain,
            title: section.title,
            timeLimitSec: section.timeLimitSec,
            orderIndex: section.orderIndex,
          })),
        },
      },
      include: {
        sections: true,
      },
    });
  }
  async createSection(
  formId: string,
  input: {
    type: AssessmentSectionType;
    domain: AssessmentDomain;
    title: string;
    timeLimitSec: number;
    orderIndex: number;
  },
) {
  await this.findFormById(formId);

  return this.prisma.assessmentSection.create({
    data: {
      formId,
      type: input.type,
      domain: input.domain,
      title: input.title,
      timeLimitSec: input.timeLimitSec,
      orderIndex: input.orderIndex,
    },
  });
}

async listSectionsForForm(formId: string) {
  await this.findFormById(formId);

  return this.prisma.assessmentSection.findMany({
    where: { formId },
    orderBy: { orderIndex: 'asc' },
    include: {
      items: {
        where: { status: 'ACTIVE' },
        include: { item: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });
}
async attachItemToForm(input: {
  formId: string;
  sectionId: string;
  itemId: string;
  orderIndex: number;
}) {
  const form = await this.findFormById(input.formId);

  const section = await this.prisma.assessmentSection.findUnique({
    where: { id: input.sectionId },
  });

  if (!section || section.formId !== form.id) {
    throw new NotFoundException('Section not found for this form');
  }

  const item = await this.prisma.item.findUnique({
    where: { id: input.itemId },
  });

  if (!item) {
    throw new NotFoundException('Item not found');
  }

  if (item.status !== 'ACTIVE') {
    throw new BadRequestException('Only active items can be attached to a form');
  }

  return this.prisma.formItemMapping.create({
    data: {
      formId: input.formId,
      sectionId: input.sectionId,
      itemId: input.itemId,
      orderIndex: input.orderIndex,
      status: 'ACTIVE',
    },
    include: {
      item: true,
      section: true,
      form: true,
    },
  });
}

async updateFormItemMappingStatus(
  mappingId: string,
  status: 'ACTIVE' | 'INACTIVE',
) {
  return this.prisma.formItemMapping.update({
    where: { id: mappingId },
    data: { status },
  });
}
}