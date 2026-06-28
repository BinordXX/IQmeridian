import { BadRequestException, Injectable } from '@nestjs/common';
import { ContactMessageEnquiryType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

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