import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AssessmentDomain,
  AssessmentFormStatus,
  AssessmentSectionType,
  FormItemMappingStatus,
  FormSectionAssignmentStatus,
  ItemIntendedDifficulty,
  ItemReviewEventAction,
  ItemReviewStatus,
  ItemStatus,
  Prisma,
  PsychometricItemStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

type AssessmentActor = {
  id: string;
  role: string;
};

type AssignedSectionItemInput = {
  prompt: string;
  stimulus?: unknown;
  itemType: string;
  options?: unknown;
  correctAnswer?: unknown;
  scoringRule?: string;
  difficulty?: string;
  subdomain?: string;
  itemFamily?: string;
  stimulusType?: string;
  intendedDifficulty?: ItemIntendedDifficulty;
  estimatedResponseTimeSec?: number;
  cognitiveProcess?: string;
  itemRationale?: string;
  distractorRationale?: unknown;
};

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
      versionLabel?: string;
      isActive?: boolean;
      formStatus?: AssessmentFormStatus;
      targetBankItemCount?: number;
      deliveryItemCount?: number;
      randomizeItems?: boolean;
      randomizeOptions?: boolean;
      sections?: {
        type: AssessmentSectionType;
        domain: AssessmentDomain;
        title: string;
        timeLimitSec: number;
        orderIndex: number;
        targetBankItemCount?: number;
        deliveryItemCount?: number;
        difficultyMix?: unknown;
      }[];
    },
    actorUserId: string,
  ) {
    const formStatus = input.formStatus ?? AssessmentFormStatus.DRAFT;
    const isActive =
      input.isActive ?? formStatus === AssessmentFormStatus.PUBLIC;

    const form = await this.prisma.assessmentForm.create({
      data: {
        name: input.name,
        version: input.version ?? 1,
        versionLabel: input.versionLabel,
        isActive,
        formStatus,
        targetBankItemCount: input.targetBankItemCount ?? 0,
        deliveryItemCount: input.deliveryItemCount ?? 30,
        randomizeItems: input.randomizeItems ?? true,
        randomizeOptions: input.randomizeOptions ?? true,
        createdByAdminId: actorUserId,
        publishedByAdminId:
          formStatus === AssessmentFormStatus.PUBLIC ? actorUserId : null,
        publishedAt:
          formStatus === AssessmentFormStatus.PUBLIC ? new Date() : null,
        sections: input.sections
          ? {
              create: input.sections.map((section) => ({
                type: section.type,
                domain: section.domain,
                title: section.title,
                timeLimitSec: section.timeLimitSec,
                orderIndex: section.orderIndex,
                targetBankItemCount: section.targetBankItemCount ?? 0,
                deliveryItemCount: section.deliveryItemCount ?? 0,
                difficultyMix: this.toOptionalJsonValue(section.difficultyMix),
              })),
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
        versionLabel: form.versionLabel,
        isActive: form.isActive,
        formStatus: form.formStatus,
        targetBankItemCount: form.targetBankItemCount,
        deliveryItemCount: form.deliveryItemCount,
        randomizeItems: form.randomizeItems,
        randomizeOptions: form.randomizeOptions,
        sectionCount: form.sections.length,
      },
    });

    return form;
  }

  async findActiveForms(
    filters: { page?: number; limit?: number; name?: string } = {},
  ) {
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

  async listAssessmentForms(status?: string) {
    const formStatus = this.toAssessmentFormStatusFilter(status);

    return this.prisma.assessmentForm.findMany({
      where: {
        formStatus,
      },
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      include: {
        sections: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        items: {
          include: {
            item: true,
            section: true,
          },
        },
        createdByAdmin: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        publishedByAdmin: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            sections: true,
            items: true,
            sectionAssignments: true,
            sessions: true,
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

  async setFormActive(id: string, isActive: boolean, actorUserId: string) {
    await this.findFormById(id);

    const form = await this.prisma.assessmentForm.update({
      where: { id },
      data: {
        isActive,
        formStatus: isActive
          ? AssessmentFormStatus.PUBLIC
          : AssessmentFormStatus.INTERNAL,
        publishedByAdminId: isActive ? actorUserId : null,
        publishedAt: isActive ? new Date() : null,
      },
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

  async updateFormPublicationStatus(
    id: string,
    formStatus: AssessmentFormStatus,
    actorUserId: string,
  ) {
    const existingForm = await this.findFormById(id);
    const now = new Date();

    const data: Prisma.AssessmentFormUpdateInput = {
      formStatus,
      isActive: formStatus === AssessmentFormStatus.PUBLIC,
      archivedAt: formStatus === AssessmentFormStatus.ARCHIVED ? now : null,
    };

    if (formStatus === AssessmentFormStatus.PUBLIC) {
      data.publishedByAdmin = {
        connect: {
          id: actorUserId,
        },
      };
      data.publishedAt = now;
    }

    if (formStatus !== AssessmentFormStatus.PUBLIC) {
      data.publishedByAdmin = {
        disconnect: true,
      };
      data.publishedAt = null;
    }

    const form = await this.prisma.assessmentForm.update({
      where: {
        id,
      },
      data,
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

    await this.auditService.record({
      action: 'ASSESSMENT_FORM_PUBLICATION_STATUS_UPDATED',
      userId: actorUserId,
      entityType: 'AssessmentForm',
      entityId: form.id,
      metadata: {
        previousFormStatus: existingForm.formStatus,
        nextFormStatus: form.formStatus,
        previousIsActive: existingForm.isActive,
        nextIsActive: form.isActive,
        publishedByAdminId: form.publishedByAdminId,
        publishedAt: form.publishedAt,
        archivedAt: form.archivedAt,
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
        versionLabel: `v${existing.version + 1}`,
        isActive: false,
        formStatus: AssessmentFormStatus.DRAFT,
        targetBankItemCount: existing.targetBankItemCount,
        deliveryItemCount: existing.deliveryItemCount,
        randomizeItems: existing.randomizeItems,
        randomizeOptions: existing.randomizeOptions,
        scoringVersion: existing.scoringVersion,
        reportVersion: existing.reportVersion,
        domainBlueprint: this.toOptionalJsonValue(existing.domainBlueprint),
        timingRules: this.toOptionalJsonValue(existing.timingRules),
        createdByAdminId: actorUserId,
        sections: {
          create: existing.sections.map((section) => ({
            type: section.type,
            domain: section.domain,
            title: section.title,
            timeLimitSec: section.timeLimitSec,
            orderIndex: section.orderIndex,
            targetBankItemCount: section.targetBankItemCount,
            deliveryItemCount: section.deliveryItemCount,
            difficultyMix: this.toOptionalJsonValue(section.difficultyMix),
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
        versionLabel: form.versionLabel,
        isActive: form.isActive,
        formStatus: form.formStatus,
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
      targetBankItemCount?: number;
      deliveryItemCount?: number;
      difficultyMix?: unknown;
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
        targetBankItemCount: input.targetBankItemCount ?? 0,
        deliveryItemCount: input.deliveryItemCount ?? 0,
        difficultyMix: this.toOptionalJsonValue(input.difficultyMix),
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
        targetBankItemCount: section.targetBankItemCount,
        deliveryItemCount: section.deliveryItemCount,
        difficultyMix: section.difficultyMix,
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

  async assignResearcherToSection(
    input: {
      formId: string;
      sectionId: string;
      researcherId: string;
      targetItemCount?: number;
      notes?: string;
      dueAt?: string;
    },
    actorUserId: string,
  ) {
    const form = await this.prisma.assessmentForm.findUnique({
      where: {
        id: input.formId,
      },
      select: {
        id: true,
        name: true,
        version: true,
        versionLabel: true,
        formStatus: true,
        isActive: true,
      },
    });

    if (!form) {
      throw new NotFoundException('Assessment form was not found.');
    }

    const section = await this.prisma.assessmentSection.findUnique({
      where: {
        id: input.sectionId,
      },
      select: {
        id: true,
        formId: true,
        title: true,
        domain: true,
        type: true,
      },
    });

    if (!section || section.formId !== form.id) {
      throw new NotFoundException('Section was not found for this form.');
    }

    const researcher = await this.prisma.user.findUnique({
      where: {
        id: input.researcherId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!researcher) {
      throw new NotFoundException('Researcher was not found.');
    }

    if (researcher.role !== UserRole.RESEARCHER) {
      throw new BadRequestException(
        'Only users with the researcher role can be assigned to form sections.',
      );
    }

    if (researcher.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        'Only active researchers can be assigned to form sections.',
      );
    }

    const existingActiveAssignment =
      await this.prisma.assessmentFormSectionResearcherAssignment.findFirst({
        where: {
          formId: form.id,
          sectionId: section.id,
          researcherId: researcher.id,
          status: {
            in: [
              FormSectionAssignmentStatus.ACTIVE,
              FormSectionAssignmentStatus.PAUSED,
            ],
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (existingActiveAssignment) {
      throw new BadRequestException(
        'This researcher is already assigned to this section.',
      );
    }

    const assignment =
      await this.prisma.assessmentFormSectionResearcherAssignment.create({
        data: {
          formId: form.id,
          sectionId: section.id,
          researcherId: researcher.id,
          assignedByAdminId: actorUserId,
          targetItemCount: input.targetItemCount ?? 0,
          notes: this.toOptionalString(input.notes),
          dueAt: this.toOptionalDate(input.dueAt),
          status: FormSectionAssignmentStatus.ACTIVE,
        },
        include: {
          form: {
            select: {
              id: true,
              name: true,
              version: true,
              versionLabel: true,
              formStatus: true,
              isActive: true,
            },
          },
          section: true,
          researcher: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
            },
          },
          assignedByAdmin: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      });

    await this.auditService.record({
      action: 'ASSESSMENT_SECTION_RESEARCHER_ASSIGNED',
      userId: actorUserId,
      entityType: 'AssessmentFormSectionResearcherAssignment',
      entityId: assignment.id,
      metadata: {
        formId: assignment.formId,
        sectionId: assignment.sectionId,
        researcherId: assignment.researcherId,
        assignedByAdminId: actorUserId,
        targetItemCount: assignment.targetItemCount,
        status: assignment.status,
        dueAt: assignment.dueAt,
      },
    });

    return assignment;
  }

  async listResearcherAssignmentsForSection(input: {
    formId: string;
    sectionId: string;
  }) {
    const section = await this.prisma.assessmentSection.findUnique({
      where: {
        id: input.sectionId,
      },
      select: {
        id: true,
        formId: true,
      },
    });

    if (!section || section.formId !== input.formId) {
      throw new NotFoundException('Section was not found for this form.');
    }

    return this.prisma.assessmentFormSectionResearcherAssignment.findMany({
      where: {
        formId: input.formId,
        sectionId: input.sectionId,
      },
      orderBy: {
        assignedAt: 'desc',
      },
      include: {
        researcher: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
          },
        },
        assignedByAdmin: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            items: true,
            reviewEvents: true,
          },
        },
      },
    });
  }

  async listMyResearcherAssignments(researcherId: string) {
    return this.prisma.assessmentFormSectionResearcherAssignment.findMany({
      where: {
        researcherId,
        status: {
          in: [
            FormSectionAssignmentStatus.ACTIVE,
            FormSectionAssignmentStatus.PAUSED,
          ],
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
      include: {
        form: {
          select: {
            id: true,
            name: true,
            version: true,
            versionLabel: true,
            formStatus: true,
            isActive: true,
            targetBankItemCount: true,
            deliveryItemCount: true,
          },
        },
        section: true,
        assignedByAdmin: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            items: true,
            reviewEvents: true,
          },
        },
      },
    });
  }
  async listItemsForSectionAssignment(
    assignmentId: string,
    actor: AssessmentActor,
  ) {
    const assignment = await this.getSectionAssignmentForItemAuthoring(
      assignmentId,
      actor,
    );

    const items = await this.prisma.item.findMany({
      where: {
        sourceAssignmentId: assignment.id,
      },
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      include: {
        assignedForm: {
          select: {
            id: true,
            name: true,
            version: true,
            versionLabel: true,
            formStatus: true,
            isActive: true,
          },
        },
        assignedSection: true,
        createdByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        submittedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        reviewEvents: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
          include: {
            actor: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
          },
        },
        formMappings: {
          include: {
            form: {
              select: {
                id: true,
                name: true,
                version: true,
                versionLabel: true,
              },
            },
            section: true,
          },
        },
      },
    });

    return {
      assignment,
      items,
    };
  }

  async createItemForSectionAssignment(
    assignmentId: string,
    input: AssignedSectionItemInput,
    actor: AssessmentActor,
  ) {
    const assignment = await this.getSectionAssignmentForItemAuthoring(
      assignmentId,
      actor,
    );

    if (assignment.status !== FormSectionAssignmentStatus.ACTIVE) {
      throw new BadRequestException(
        'Items can only be created for active researcher assignments.',
      );
    }

    const item = await this.prisma.item.create({
      data: {
        domain: assignment.section.domain,
        prompt: input.prompt,
        stimulus: this.toOptionalJsonValue(input.stimulus),
        itemType: input.itemType,
        options: this.toOptionalJsonValue(input.options),
        correctAnswer: this.toOptionalJsonValue(input.correctAnswer),
        scoringRule: input.scoringRule ?? 'BINARY_CORRECT',
        difficulty: this.toOptionalString(input.difficulty),
        subdomain: this.toOptionalString(input.subdomain),
        itemFamily: this.toOptionalString(input.itemFamily),
        stimulusType: this.toOptionalString(input.stimulusType),
        intendedDifficulty: input.intendedDifficulty,
        estimatedResponseTimeSec: input.estimatedResponseTimeSec,
        cognitiveProcess: this.toOptionalString(input.cognitiveProcess),
        itemRationale: this.toOptionalString(input.itemRationale),
        distractorRationale: this.toOptionalJsonValue(
          input.distractorRationale,
        ),
        status: ItemStatus.DRAFT,
        reviewStatus: ItemReviewStatus.NOT_REVIEWED,
        psychometricStatus: PsychometricItemStatus.DRAFT,
        createdByUserId: actor.id,
        assignedFormId: assignment.formId,
        assignedSectionId: assignment.sectionId,
        sourceAssignmentId: assignment.id,
      },
      include: {
        assignedForm: {
          select: {
            id: true,
            name: true,
            version: true,
            versionLabel: true,
            formStatus: true,
            isActive: true,
          },
        },
        assignedSection: true,
        sourceAssignment: true,
        createdByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    await this.prisma.itemReviewEvent.create({
      data: {
        itemId: item.id,
        actorId: actor.id,
        assignmentId: assignment.id,
        action: ItemReviewEventAction.CREATED,
        toStatus: item.reviewStatus,
        metadata: {
          formId: assignment.formId,
          sectionId: assignment.sectionId,
          domain: item.domain,
          intendedDifficulty: item.intendedDifficulty,
        },
      },
    });

    await this.auditService.record({
      action: 'ASSIGNED_SECTION_ITEM_CREATED',
      userId: actor.id,
      entityType: 'Item',
      entityId: item.id,
      metadata: {
        assignmentId: assignment.id,
        formId: assignment.formId,
        sectionId: assignment.sectionId,
        domain: item.domain,
        itemType: item.itemType,
        status: item.status,
        reviewStatus: item.reviewStatus,
        psychometricStatus: item.psychometricStatus,
        intendedDifficulty: item.intendedDifficulty,
      },
    });

    return item;
  }

  async updateItemForSectionAssignment(
    input: {
      assignmentId: string;
      itemId: string;
      updates: Partial<AssignedSectionItemInput>;
    },
    actor: AssessmentActor,
  ) {
    const assignment = await this.getSectionAssignmentForItemAuthoring(
      input.assignmentId,
      actor,
    );

    const item = await this.prisma.item.findUnique({
      where: {
        id: input.itemId,
      },
      select: {
        id: true,
        sourceAssignmentId: true,
        status: true,
        reviewStatus: true,
      },
    });

    if (!item || item.sourceAssignmentId !== assignment.id) {
      throw new NotFoundException('Item was not found for this assignment.');
    }

    if (
      item.status !== ItemStatus.DRAFT ||
      (item.reviewStatus !== ItemReviewStatus.NOT_REVIEWED &&
        item.reviewStatus !== ItemReviewStatus.NEEDS_REVISION)
    ) {
      throw new BadRequestException(
        'Only draft items that have not been approved can be edited.',
      );
    }

    const updatedItem = await this.prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        prompt: input.updates.prompt,
        stimulus: this.toOptionalJsonValue(input.updates.stimulus),
        itemType: input.updates.itemType,
        options: this.toOptionalJsonValue(input.updates.options),
        correctAnswer: this.toOptionalJsonValue(input.updates.correctAnswer),
        scoringRule: input.updates.scoringRule,
        difficulty: this.toOptionalString(input.updates.difficulty),
        subdomain: this.toOptionalString(input.updates.subdomain),
        itemFamily: this.toOptionalString(input.updates.itemFamily),
        stimulusType: this.toOptionalString(input.updates.stimulusType),
        intendedDifficulty: input.updates.intendedDifficulty,
        estimatedResponseTimeSec: input.updates.estimatedResponseTimeSec,
        cognitiveProcess: this.toOptionalString(input.updates.cognitiveProcess),
        itemRationale: this.toOptionalString(input.updates.itemRationale),
        distractorRationale: this.toOptionalJsonValue(
          input.updates.distractorRationale,
        ),
      },
      include: {
        assignedForm: {
          select: {
            id: true,
            name: true,
            version: true,
            versionLabel: true,
            formStatus: true,
            isActive: true,
          },
        },
        assignedSection: true,
        sourceAssignment: true,
      },
    });

    await this.prisma.itemReviewEvent.create({
      data: {
        itemId: updatedItem.id,
        actorId: actor.id,
        assignmentId: assignment.id,
        action: ItemReviewEventAction.UPDATED,
        fromStatus: item.reviewStatus,
        toStatus: updatedItem.reviewStatus,
        metadata: {
          formId: assignment.formId,
          sectionId: assignment.sectionId,
        },
      },
    });

    await this.auditService.record({
      action: 'ASSIGNED_SECTION_ITEM_UPDATED',
      userId: actor.id,
      entityType: 'Item',
      entityId: updatedItem.id,
      metadata: {
        assignmentId: assignment.id,
        formId: assignment.formId,
        sectionId: assignment.sectionId,
        status: updatedItem.status,
        reviewStatus: updatedItem.reviewStatus,
      },
    });

    return updatedItem;
  }

  async submitItemForReviewFromSectionAssignment(
    input: {
      assignmentId: string;
      itemId: string;
    },
    actor: AssessmentActor,
  ) {
    const assignment = await this.getSectionAssignmentForItemAuthoring(
      input.assignmentId,
      actor,
    );

    const item = await this.prisma.item.findUnique({
      where: {
        id: input.itemId,
      },
      select: {
        id: true,
        sourceAssignmentId: true,
        status: true,
        reviewStatus: true,
      },
    });

    if (!item || item.sourceAssignmentId !== assignment.id) {
      throw new NotFoundException('Item was not found for this assignment.');
    }

    if (
      item.status !== ItemStatus.DRAFT ||
      (item.reviewStatus !== ItemReviewStatus.NOT_REVIEWED &&
        item.reviewStatus !== ItemReviewStatus.NEEDS_REVISION)
    ) {
      throw new BadRequestException(
        'Only draft items can be submitted for review.',
      );
    }

    const submittedItem = await this.prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        status: ItemStatus.UNDER_REVIEW,
        reviewStatus: ItemReviewStatus.SUBMITTED_FOR_REVIEW,
        psychometricStatus: PsychometricItemStatus.UNDER_REVIEW,
        submittedByUserId: actor.id,
        submittedAt: new Date(),
        rejectionReason: null,
        revisionRequestReason: null,
      },
      include: {
        assignedForm: {
          select: {
            id: true,
            name: true,
            version: true,
            versionLabel: true,
            formStatus: true,
            isActive: true,
          },
        },
        assignedSection: true,
        sourceAssignment: true,
        submittedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    await this.prisma.itemReviewEvent.create({
      data: {
        itemId: submittedItem.id,
        actorId: actor.id,
        assignmentId: assignment.id,
        action: ItemReviewEventAction.SUBMITTED_FOR_REVIEW,
        fromStatus: item.reviewStatus,
        toStatus: submittedItem.reviewStatus,
        metadata: {
          formId: assignment.formId,
          sectionId: assignment.sectionId,
          submittedAt: submittedItem.submittedAt?.toISOString() ?? null,
        },
      },
    });

    await this.auditService.record({
      action: 'ASSIGNED_SECTION_ITEM_SUBMITTED_FOR_REVIEW',
      userId: actor.id,
      entityType: 'Item',
      entityId: submittedItem.id,
      metadata: {
        assignmentId: assignment.id,
        formId: assignment.formId,
        sectionId: assignment.sectionId,
        previousStatus: item.status,
        nextStatus: submittedItem.status,
        previousReviewStatus: item.reviewStatus,
        nextReviewStatus: submittedItem.reviewStatus,
      },
    });

    return submittedItem;
  }

  async listAssignedSectionItemsForReview() {
    return this.prisma.item.findMany({
      where: {
        sourceAssignmentId: {
          not: null,
        },
        reviewStatus: {
          in: [
            ItemReviewStatus.SUBMITTED_FOR_REVIEW,
            ItemReviewStatus.REVIEW_IN_PROGRESS,
            ItemReviewStatus.NEEDS_REVISION,
            ItemReviewStatus.REJECTED,
            ItemReviewStatus.APPROVED,
          ],
        },
      },
      orderBy: [
        {
          submittedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      include: {
        assignedForm: {
          select: {
            id: true,
            name: true,
            version: true,
            versionLabel: true,
            formStatus: true,
            isActive: true,
          },
        },
        assignedSection: true,
        sourceAssignment: {
          include: {
            researcher: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
              },
            },
          },
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        submittedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        formMappings: {
          include: {
            form: {
              select: {
                id: true,
                name: true,
                version: true,
                versionLabel: true,
              },
            },
            section: true,
          },
        },
      },
    });
  }

  async startAssignedSectionItemReview(
    itemId: string,
    input: {
      reviewNotes?: string;
    },
    actorUserId: string,
  ) {
    const item = await this.getAssignedSectionReviewItem(itemId);

    if (item.reviewStatus !== ItemReviewStatus.SUBMITTED_FOR_REVIEW) {
      throw new BadRequestException(
        'Only submitted items can be moved into review.',
      );
    }

    const reviewedItem = await this.prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        reviewStatus: ItemReviewStatus.REVIEW_IN_PROGRESS,
        reviewedByUserId: actorUserId,
        reviewedAt: new Date(),
        lastReviewedAt: new Date(),
        reviewNotes: this.toOptionalString(input.reviewNotes),
      },
      include: this.assignedSectionItemReviewInclude(),
    });

    await this.recordItemReviewEvent({
      itemId: reviewedItem.id,
      actorUserId,
      assignmentId: reviewedItem.sourceAssignmentId,
      action: ItemReviewEventAction.REVIEW_STARTED,
      fromStatus: item.reviewStatus,
      toStatus: reviewedItem.reviewStatus,
      notes: input.reviewNotes,
    });

    await this.auditService.record({
      action: 'ASSIGNED_SECTION_ITEM_REVIEW_STARTED',
      userId: actorUserId,
      entityType: 'Item',
      entityId: reviewedItem.id,
      metadata: {
        formId: reviewedItem.assignedFormId,
        sectionId: reviewedItem.assignedSectionId,
        assignmentId: reviewedItem.sourceAssignmentId,
        previousReviewStatus: item.reviewStatus,
        nextReviewStatus: reviewedItem.reviewStatus,
      },
    });

    return reviewedItem;
  }

  async requestAssignedSectionItemChanges(
    itemId: string,
    input: {
      reviewNotes?: string;
      reason?: string;
    },
    actorUserId: string,
  ) {
    const item = await this.getAssignedSectionReviewItem(itemId);

    if (
      item.reviewStatus !== ItemReviewStatus.SUBMITTED_FOR_REVIEW &&
      item.reviewStatus !== ItemReviewStatus.REVIEW_IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Only submitted or in-review items can receive change requests.',
      );
    }

    const updatedItem = await this.prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        status: ItemStatus.DRAFT,
        reviewStatus: ItemReviewStatus.NEEDS_REVISION,
        psychometricStatus: PsychometricItemStatus.DRAFT,
        reviewedByUserId: actorUserId,
        reviewedAt: new Date(),
        lastReviewedAt: new Date(),
        reviewNotes: this.toOptionalString(input.reviewNotes),
        revisionRequestReason: this.toOptionalString(input.reason),
      },
      include: this.assignedSectionItemReviewInclude(),
    });

    await this.recordItemReviewEvent({
      itemId: updatedItem.id,
      actorUserId,
      assignmentId: updatedItem.sourceAssignmentId,
      action: ItemReviewEventAction.CHANGES_REQUESTED,
      fromStatus: item.reviewStatus,
      toStatus: updatedItem.reviewStatus,
      notes: input.reason ?? input.reviewNotes,
    });

    await this.auditService.record({
      action: 'ASSIGNED_SECTION_ITEM_CHANGES_REQUESTED',
      userId: actorUserId,
      entityType: 'Item',
      entityId: updatedItem.id,
      metadata: {
        formId: updatedItem.assignedFormId,
        sectionId: updatedItem.assignedSectionId,
        assignmentId: updatedItem.sourceAssignmentId,
        previousReviewStatus: item.reviewStatus,
        nextReviewStatus: updatedItem.reviewStatus,
        reason: updatedItem.revisionRequestReason,
      },
    });

    return updatedItem;
  }

  async rejectAssignedSectionItem(
    itemId: string,
    input: {
      reviewNotes?: string;
      reason?: string;
    },
    actorUserId: string,
  ) {
    const item = await this.getAssignedSectionReviewItem(itemId);

    if (
      item.reviewStatus !== ItemReviewStatus.SUBMITTED_FOR_REVIEW &&
      item.reviewStatus !== ItemReviewStatus.REVIEW_IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Only submitted or in-review items can be rejected.',
      );
    }

    const rejectedItem = await this.prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        status: ItemStatus.RETIRED,
        reviewStatus: ItemReviewStatus.REJECTED,
        psychometricStatus: PsychometricItemStatus.RETIRED,
        reviewedByUserId: actorUserId,
        reviewedAt: new Date(),
        lastReviewedAt: new Date(),
        reviewNotes: this.toOptionalString(input.reviewNotes),
        rejectionReason: this.toOptionalString(input.reason),
        retiredByUserId: actorUserId,
        retiredAt: new Date(),
      },
      include: this.assignedSectionItemReviewInclude(),
    });

    await this.recordItemReviewEvent({
      itemId: rejectedItem.id,
      actorUserId,
      assignmentId: rejectedItem.sourceAssignmentId,
      action: ItemReviewEventAction.REJECTED,
      fromStatus: item.reviewStatus,
      toStatus: rejectedItem.reviewStatus,
      notes: input.reason ?? input.reviewNotes,
    });

    await this.auditService.record({
      action: 'ASSIGNED_SECTION_ITEM_REJECTED',
      userId: actorUserId,
      entityType: 'Item',
      entityId: rejectedItem.id,
      metadata: {
        formId: rejectedItem.assignedFormId,
        sectionId: rejectedItem.assignedSectionId,
        assignmentId: rejectedItem.sourceAssignmentId,
        previousReviewStatus: item.reviewStatus,
        nextReviewStatus: rejectedItem.reviewStatus,
        reason: rejectedItem.rejectionReason,
      },
    });

    return rejectedItem;
  }

  async approveAssignedSectionItem(
    itemId: string,
    input: {
      reviewNotes?: string;
      activate?: boolean;
      orderIndex?: number;
    },
    actorUserId: string,
  ) {
    const item = await this.getAssignedSectionReviewItem(itemId);

    if (
      item.reviewStatus !== ItemReviewStatus.SUBMITTED_FOR_REVIEW &&
      item.reviewStatus !== ItemReviewStatus.REVIEW_IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Only submitted or in-review items can be approved.',
      );
    }

    if (!item.assignedFormId || !item.assignedSectionId) {
      throw new BadRequestException(
        'Assigned form and section are required before item approval.',
      );
    }

    const shouldActivate = input.activate ?? true;
    const nextStatus = shouldActivate ? ItemStatus.ACTIVE : ItemStatus.DRAFT;
    const now = new Date();

    const approvedItem = await this.prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        status: nextStatus,
        reviewStatus: ItemReviewStatus.APPROVED,
        psychometricStatus: shouldActivate
          ? PsychometricItemStatus.ASSESSMENT_READY
          : PsychometricItemStatus.CONTENT_REVIEWED,
        reviewedByUserId: actorUserId,
        reviewedAt: now,
        lastReviewedAt: now,
        approvedByUserId: actorUserId,
        approvedAt: now,
        activatedByUserId: shouldActivate ? actorUserId : null,
        activatedAt: shouldActivate ? now : null,
        reviewNotes: this.toOptionalString(input.reviewNotes),
        rejectionReason: null,
        revisionRequestReason: null,
      },
      include: this.assignedSectionItemReviewInclude(),
    });

    const mapping = shouldActivate
      ? await this.upsertApprovedItemFormMapping({
          itemId: approvedItem.id,
          formId: item.assignedFormId,
          sectionId: item.assignedSectionId,
          sourceAssignmentId: item.sourceAssignmentId,
          actorUserId,
          orderIndex: input.orderIndex,
        })
      : null;

    await this.recordItemReviewEvent({
      itemId: approvedItem.id,
      actorUserId,
      assignmentId: approvedItem.sourceAssignmentId,
      action: ItemReviewEventAction.APPROVED,
      fromStatus: item.reviewStatus,
      toStatus: approvedItem.reviewStatus,
      notes: input.reviewNotes,
      metadata: {
        activated: shouldActivate,
        mappingId: mapping?.id ?? null,
      },
    });

    if (shouldActivate) {
      await this.recordItemReviewEvent({
        itemId: approvedItem.id,
        actorUserId,
        assignmentId: approvedItem.sourceAssignmentId,
        action: ItemReviewEventAction.ACTIVATED,
        fromStatus: item.status,
        toStatus: approvedItem.status,
        notes: input.reviewNotes,
        metadata: {
          mappingId: mapping?.id ?? null,
        },
      });
    }

    await this.auditService.record({
      action: 'ASSIGNED_SECTION_ITEM_APPROVED',
      userId: actorUserId,
      entityType: 'Item',
      entityId: approvedItem.id,
      metadata: {
        formId: approvedItem.assignedFormId,
        sectionId: approvedItem.assignedSectionId,
        assignmentId: approvedItem.sourceAssignmentId,
        previousStatus: item.status,
        nextStatus: approvedItem.status,
        previousReviewStatus: item.reviewStatus,
        nextReviewStatus: approvedItem.reviewStatus,
        activated: shouldActivate,
        mappingId: mapping?.id ?? null,
      },
    });

    return {
      item: approvedItem,
      mapping,
    };
  }

  async updateResearcherAssignmentStatus(
    assignmentId: string,
    status: FormSectionAssignmentStatus,
    actorUserId: string,
  ) {
    const existingAssignment =
      await this.prisma.assessmentFormSectionResearcherAssignment.findUnique({
        where: {
          id: assignmentId,
        },
        select: {
          id: true,
          formId: true,
          sectionId: true,
          researcherId: true,
          status: true,
        },
      });

    if (!existingAssignment) {
      throw new NotFoundException('Researcher assignment was not found.');
    }

    const assignment =
      await this.prisma.assessmentFormSectionResearcherAssignment.update({
        where: {
          id: assignmentId,
        },
        data: {
          status,
          completedAt:
            status === FormSectionAssignmentStatus.COMPLETED
              ? new Date()
              : null,
        },
        include: {
          form: {
            select: {
              id: true,
              name: true,
              version: true,
              versionLabel: true,
              formStatus: true,
              isActive: true,
            },
          },
          section: true,
          researcher: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
            },
          },
          assignedByAdmin: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      });

    await this.auditService.record({
      action: 'ASSESSMENT_SECTION_RESEARCHER_ASSIGNMENT_STATUS_UPDATED',
      userId: actorUserId,
      entityType: 'AssessmentFormSectionResearcherAssignment',
      entityId: assignment.id,
      metadata: {
        formId: assignment.formId,
        sectionId: assignment.sectionId,
        researcherId: assignment.researcherId,
        previousStatus: existingAssignment.status,
        nextStatus: assignment.status,
        completedAt: assignment.completedAt,
      },
    });

    return assignment;
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
      throw new BadRequestException(
        'Only active items can be attached to a form',
      );
    }

    const mapping = await this.prisma.formItemMapping.create({
      data: {
        formId: input.formId,
        sectionId: input.sectionId,
        itemId: input.itemId,
        orderIndex: input.orderIndex,
        status: FormItemMappingStatus.ACTIVE,
        activatedByAdminId: actorUserId,
        activatedAt: new Date(),
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

  private assignedSectionItemReviewInclude() {
    return {
      assignedForm: {
        select: {
          id: true,
          name: true,
          version: true,
          versionLabel: true,
          formStatus: true,
          isActive: true,
        },
      },
      assignedSection: true,
      sourceAssignment: {
        include: {
          researcher: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
            },
          },
        },
      },
      createdByUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      submittedByUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      reviewedByUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      approvedByUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      formMappings: {
        include: {
          form: {
            select: {
              id: true,
              name: true,
              version: true,
              versionLabel: true,
            },
          },
          section: true,
        },
      },
    } satisfies Prisma.ItemInclude;
  }

  private async getAssignedSectionReviewItem(itemId: string) {
    const item = await this.prisma.item.findUnique({
      where: {
        id: itemId,
      },
      include: {
        assignedForm: {
          select: {
            id: true,
            name: true,
            version: true,
            versionLabel: true,
            formStatus: true,
            isActive: true,
          },
        },
        assignedSection: true,
        sourceAssignment: true,
      },
    });

    if (!item || !item.sourceAssignmentId) {
      throw new NotFoundException(
        'Assigned-section review item was not found.',
      );
    }

    return item;
  }

  private async upsertApprovedItemFormMapping(input: {
    itemId: string;
    formId: string;
    sectionId: string;
    sourceAssignmentId: string | null;
    actorUserId: string;
    orderIndex?: number;
  }) {
    const existingMapping = await this.prisma.formItemMapping.findUnique({
      where: {
        formId_itemId: {
          formId: input.formId,
          itemId: input.itemId,
        },
      },
    });

    const orderIndex =
      input.orderIndex ??
      existingMapping?.orderIndex ??
      (await this.getNextFormSectionItemOrderIndex({
        formId: input.formId,
        sectionId: input.sectionId,
      }));

    if (existingMapping) {
      return this.prisma.formItemMapping.update({
        where: {
          id: existingMapping.id,
        },
        data: {
          sectionId: input.sectionId,
          orderIndex,
          status: FormItemMappingStatus.ACTIVE,
          sourceAssignmentId: input.sourceAssignmentId,
          activatedByAdminId: input.actorUserId,
          activatedAt: new Date(),
          deactivatedAt: null,
        },
        include: {
          item: true,
          section: true,
          form: true,
        },
      });
    }

    return this.prisma.formItemMapping.create({
      data: {
        formId: input.formId,
        sectionId: input.sectionId,
        itemId: input.itemId,
        orderIndex,
        status: FormItemMappingStatus.ACTIVE,
        sourceAssignmentId: input.sourceAssignmentId,
        activatedByAdminId: input.actorUserId,
        activatedAt: new Date(),
      },
      include: {
        item: true,
        section: true,
        form: true,
      },
    });
  }

  private async getNextFormSectionItemOrderIndex(input: {
    formId: string;
    sectionId: string;
  }) {
    const latestMapping = await this.prisma.formItemMapping.findFirst({
      where: {
        formId: input.formId,
        sectionId: input.sectionId,
      },
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        orderIndex: true,
      },
    });

    return (latestMapping?.orderIndex ?? -1) + 1;
  }

  private async recordItemReviewEvent(input: {
    itemId: string;
    actorUserId: string;
    assignmentId?: string | null;
    action: ItemReviewEventAction;
    fromStatus?: string | null;
    toStatus?: string | null;
    notes?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.itemReviewEvent.create({
      data: {
        itemId: input.itemId,
        actorId: input.actorUserId,
        assignmentId: input.assignmentId ?? null,
        action: input.action,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        notes: this.toOptionalString(input.notes),
        metadata: input.metadata,
      },
    });
  }

  private async getSectionAssignmentForItemAuthoring(
    assignmentId: string,
    actor: AssessmentActor,
  ) {
    const assignment =
      await this.prisma.assessmentFormSectionResearcherAssignment.findUnique({
        where: {
          id: assignmentId,
        },
        include: {
          form: {
            select: {
              id: true,
              name: true,
              version: true,
              versionLabel: true,
              formStatus: true,
              isActive: true,
            },
          },
          section: true,
          researcher: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
            },
          },
        },
      });

    if (!assignment) {
      throw new NotFoundException('Researcher assignment was not found.');
    }

    const isAdminActor =
      actor.role === UserRole.SUPER_ADMIN ||
      actor.role === UserRole.PLATFORM_ADMIN;

    if (!isAdminActor && assignment.researcherId !== actor.id) {
      throw new BadRequestException(
        'This researcher assignment does not belong to the current user.',
      );
    }

    if (assignment.researcher.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        'Items cannot be authored for an inactive researcher assignment.',
      );
    }

    return assignment;
  }

  private toOptionalString(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    const trimmedValue = value?.trim();

    return trimmedValue ? trimmedValue : null;
  }

  private toOptionalDate(value?: string | null) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      return null;
    }

    const parsedDate = new Date(trimmedValue);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Date value is invalid.');
    }

    return parsedDate;
  }

  private toAssessmentFormStatusFilter(status?: string) {
    const trimmedStatus = status?.trim();

    if (!trimmedStatus) {
      return undefined;
    }

    if (
      Object.values(AssessmentFormStatus).includes(
        trimmedStatus as AssessmentFormStatus,
      )
    ) {
      return trimmedStatus as AssessmentFormStatus;
    }

    throw new BadRequestException('Invalid assessment form status filter.');
  }

  private toOptionalJsonValue(
    value: unknown,
  ): Prisma.InputJsonValue | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    try {
      return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
    } catch {
      throw new BadRequestException('Value must be JSON-serialisable');
    }
  }
}
