import { Injectable, NotFoundException } from '@nestjs/common';
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
}