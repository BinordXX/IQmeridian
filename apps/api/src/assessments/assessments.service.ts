import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentDomain,
  AssessmentSectionType,
  FormItemMappingStatus,
  Prisma,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createForm(
    input: {
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
    },
    actorUserId: string,
  ) {
    const form = await this.prisma.assessmentForm.create({
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

    await this.auditService.record({
      action: 'ASSESSMENT_FORM_CREATED',
      userId: actorUserId,
      entityType: 'AssessmentForm',
      entityId: form.id,
      metadata: {
        name: form.name,
        version: form.version,
        isActive: form.isActive,
        sectionCount: form.sections.length,
      },
    });

    return form;
  }

async findActiveForms(filters: { page?: number; limit?: number; name?: string } = {}) {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 25, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.AssessmentFormWhereInput = {
    isActive: true,
    ...(filters.name
      ? {
          name: {
            contains: filters.name,
            mode: 'insensitive',
          },
        }
      : {}),
  };

  const [total, data] = await this.prisma.$transaction([
    this.prisma.assessmentForm.count({ where }),
    this.prisma.assessmentForm.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        sections: true,
        items: {
          include: {
            item: true,
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

  async setFormActive(id: string, isActive: boolean, actorUserId: string) {
    await this.findFormById(id);

    const form = await this.prisma.assessmentForm.update({
      where: { id },
      data: { isActive },
    });

    await this.auditService.record({
      action: 'ASSESSMENT_FORM_ACTIVE_STATUS_UPDATED',
      userId: actorUserId,
      entityType: 'AssessmentForm',
      entityId: form.id,
      metadata: {
        name: form.name,
        version: form.version,
        isActive: form.isActive,
      },
    });

    return form;
  }

  async createNextVersion(id: string, actorUserId: string) {
    const existing = await this.findFormById(id);

    const form = await this.prisma.assessmentForm.create({
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

    await this.auditService.record({
      action: 'ASSESSMENT_FORM_VERSION_CREATED',
      userId: actorUserId,
      entityType: 'AssessmentForm',
      entityId: form.id,
      metadata: {
        sourceFormId: existing.id,
        name: form.name,
        version: form.version,
        isActive: form.isActive,
        sectionCount: form.sections.length,
      },
    });

    return form;
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
    actorUserId: string,
  ) {
    await this.findFormById(formId);

    const section = await this.prisma.assessmentSection.create({
      data: {
        formId,
        type: input.type,
        domain: input.domain,
        title: input.title,
        timeLimitSec: input.timeLimitSec,
        orderIndex: input.orderIndex,
      },
    });

    await this.auditService.record({
      action: 'ASSESSMENT_SECTION_CREATED',
      userId: actorUserId,
      entityType: 'AssessmentSection',
      entityId: section.id,
      metadata: {
        formId: section.formId,
        type: section.type,
        domain: section.domain,
        title: section.title,
        orderIndex: section.orderIndex,
        timeLimitSec: section.timeLimitSec,
      },
    });

    return section;
  }

  async listSectionsForForm(formId: string) {
    await this.findFormById(formId);

    return this.prisma.assessmentSection.findMany({
      where: { formId },
      orderBy: { orderIndex: 'asc' },
      include: {
        items: {
          where: { status: FormItemMappingStatus.ACTIVE },
          include: { item: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async attachItemToForm(
    input: {
      formId: string;
      sectionId: string;
      itemId: string;
      orderIndex: number;
    },
    actorUserId: string,
  ) {
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

    const mapping = await this.prisma.formItemMapping.create({
      data: {
        formId: input.formId,
        sectionId: input.sectionId,
        itemId: input.itemId,
        orderIndex: input.orderIndex,
        status: FormItemMappingStatus.ACTIVE,
      },
      include: {
        item: true,
        section: true,
        form: true,
      },
    });

    await this.auditService.record({
      action: 'ASSESSMENT_ITEM_ATTACHED',
      userId: actorUserId,
      entityType: 'FormItemMapping',
      entityId: mapping.id,
      metadata: {
        formId: mapping.formId,
        sectionId: mapping.sectionId,
        itemId: mapping.itemId,
        orderIndex: mapping.orderIndex,
        status: mapping.status,
      },
    });

    return mapping;
  }

  async updateFormItemMappingStatus(
    mappingId: string,
    status: FormItemMappingStatus,
    actorUserId: string,
  ) {
    const mapping = await this.prisma.formItemMapping.update({
      where: { id: mappingId },
      data: { status },
    });

    await this.auditService.record({
      action: 'ASSESSMENT_ITEM_MAPPING_STATUS_UPDATED',
      userId: actorUserId,
      entityType: 'FormItemMapping',
      entityId: mapping.id,
      metadata: {
        formId: mapping.formId,
        sectionId: mapping.sectionId,
        itemId: mapping.itemId,
        orderIndex: mapping.orderIndex,
        status: mapping.status,
      },
    });

    return mapping;
  }
}