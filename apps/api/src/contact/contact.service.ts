import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContactMessageEnquiryType,
  ContactMessageStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageStatusDto } from './dto/update-contact-message-status.dto';

type ContactAdminUser = {
  id: string;
  role: UserRole | string;
};

type ListContactMessagesOptions = {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: ContactMessageStatus;
};

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactMessageDto) {
    const fullName = this.normaliseRequiredText(dto.fullName, 'Full name');
    const email = dto.email.trim().toLowerCase();
    const organisation = this.normaliseOptionalText(dto.organisation);
    const message = this.normaliseRequiredText(dto.message, 'Message');

    const contactMessage = await this.prisma.contactMessage.create({
      data: {
        email,
        enquiryType: dto.enquiryType ?? ContactMessageEnquiryType.GENERAL,
        fullName,
        message,
        organisation,
      },
      select: {
        createdAt: true,
        id: true,
      },
    });

    return {
      id: contactMessage.id,
      message: 'Contact message received.',
      status: 'received',
      submittedAt: contactMessage.createdAt,
    };
  }

  async listForAdmin(user: ContactAdminUser, options: ListContactMessagesOptions) {
    this.assertPlatformAdmin(user);

    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 20));
    const query = options.query?.trim();

    const where = {
      ...(options.status
        ? {
            status: options.status,
          }
        : {}),
      ...(query
        ? {
            OR: [
              {
                fullName: {
                  contains: query,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive' as const,
                },
              },
              {
                organisation: {
                  contains: query,
                  mode: 'insensitive' as const,
                },
              },
              {
                message: {
                  contains: query,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, messages] = await this.prisma.$transaction([
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
          email: true,
          enquiryType: true,
          fullName: true,
          id: true,
          message: true,
          organisation: true,
          status: true,
          updatedAt: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
      }),
    ]);

    return {
      items: messages,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getForAdmin(user: ContactAdminUser, id: string) {
    this.assertPlatformAdmin(user);

    const message = await this.prisma.contactMessage.findUnique({
      where: {
        id,
      },
    });

    if (!message) {
      throw new NotFoundException('Contact message was not found.');
    }

    return message;
  }

  async updateStatusForAdmin(
    user: ContactAdminUser,
    id: string,
    dto: UpdateContactMessageStatusDto,
  ) {
    this.assertPlatformAdmin(user);

    const existingMessage = await this.prisma.contactMessage.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingMessage) {
      throw new NotFoundException('Contact message was not found.');
    }

    return this.prisma.contactMessage.update({
      data: {
        status: dto.status,
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
      where: {
        id,
      },
    });
  }

  private assertPlatformAdmin(user: ContactAdminUser) {
    if (user.role !== UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException(
        'Only platform administrators can manage contact messages.',
      );
    }
  }

  private normaliseRequiredText(value: string, label: string) {
    const normalisedValue = value.trim();

    if (!normalisedValue) {
      throw new BadRequestException(`${label} is required.`);
    }

    return normalisedValue;
  }

  private normaliseOptionalText(value: string | undefined) {
    const normalisedValue = value?.trim();

    return normalisedValue || undefined;
  }
}