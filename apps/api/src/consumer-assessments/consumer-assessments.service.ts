import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SetConsumerAssessmentDefaultDto } from './dto/set-consumer-assessment-default.dto';

const CONSUMER_DEFAULT_ASSESSMENT_KEY = 'CONSUMER_DEFAULT_ASSESSMENT';

type RequestUser = {
  id: string;
  email: string;
  role: string;
};

const assessmentFormSelect = {
  id: true,
  name: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class ConsumerAssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInternalDefaultAssessment() {
    const setting = await this.prisma.consumerAssessmentDefault.findUnique({
      where: {
        key: CONSUMER_DEFAULT_ASSESSMENT_KEY,
      },
      include: {
        assessmentForm: {
          select: assessmentFormSelect,
        },
      },
    });

    return {
      key: CONSUMER_DEFAULT_ASSESSMENT_KEY,
      isConfigured: Boolean(setting),
      isEnabled: setting?.isEnabled ?? false,
      assessmentFormId: setting?.assessmentFormId ?? null,
      assessmentForm: setting?.assessmentForm ?? null,
      updatedByUserId: setting?.updatedByUserId ?? null,
      updatedAt: setting?.updatedAt ?? null,
    };
  }

  async getConsumerDefaultAssessment() {
    const setting = await this.prisma.consumerAssessmentDefault.findUnique({
      where: {
        key: CONSUMER_DEFAULT_ASSESSMENT_KEY,
      },
      include: {
        assessmentForm: {
          select: assessmentFormSelect,
        },
      },
    });

    if (!setting?.isEnabled || !setting.assessmentForm) {
      throw new NotFoundException(
        'No consumer assessment is currently available.',
      );
    }

    if (!setting.assessmentForm.isActive) {
      throw new BadRequestException(
        'The consumer assessment form is not currently active.',
      );
    }

    return {
      assessmentFormId: setting.assessmentFormId,
      assessmentForm: setting.assessmentForm,
      availability: 'AVAILABLE',
    };
  }

  async getConsumerDefaultAssessmentFormId() {
    const defaultAssessment = await this.getConsumerDefaultAssessment();

    return defaultAssessment.assessmentFormId;
  }

  async setDefaultAssessment(
    dto: SetConsumerAssessmentDefaultDto,
    user: RequestUser,
  ) {
    const assessmentForm = await this.prisma.assessmentForm.findUnique({
      where: {
        id: dto.assessmentFormId,
      },
      select: assessmentFormSelect,
    });

    if (!assessmentForm) {
      throw new NotFoundException('Assessment form was not found.');
    }

    if (!assessmentForm.isActive) {
      throw new BadRequestException(
        'Only active forms can be selected as the consumer default.',
      );
    }

    const setting = await this.prisma.consumerAssessmentDefault.upsert({
      where: {
        key: CONSUMER_DEFAULT_ASSESSMENT_KEY,
      },
      create: {
        key: CONSUMER_DEFAULT_ASSESSMENT_KEY,
        assessmentFormId: assessmentForm.id,
        isEnabled: true,
        updatedByUserId: user.id,
      },
      update: {
        assessmentFormId: assessmentForm.id,
        isEnabled: true,
        updatedByUserId: user.id,
      },
      include: {
        assessmentForm: {
          select: assessmentFormSelect,
        },
      },
    });

    return {
      key: setting.key,
      isConfigured: true,
      isEnabled: setting.isEnabled,
      assessmentFormId: setting.assessmentFormId,
      assessmentForm: setting.assessmentForm,
      updatedByUserId: setting.updatedByUserId,
      updatedAt: setting.updatedAt,
    };
  }
}
