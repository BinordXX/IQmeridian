import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganisationsService {
  constructor(private readonly prisma: PrismaService) {}

  createOrganisation(name: string) {
    return this.prisma.organisation.create({
      data: { name },
    });
  }

  findAllOrganisations() {
    return this.prisma.organisation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: true,
        campaigns: true,
      },
    });
  }

  async findOrganisationById(id: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
      include: {
        users: true,
        campaigns: true,
      },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return organisation;
  }

  async updateOrganisation(id: string, name: string) {
    await this.findOrganisationById(id);

    return this.prisma.organisation.update({
      where: { id },
      data: { name },
    });
  }

  async attachEmployerAdminToOrganisation(
    organisationId: string,
    userId: string,
  ) {
    await this.findOrganisationById(organisationId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        organisationId,
        role: UserRole.EMPLOYER_ADMIN,
      },
      include: {
        organisation: true,
      },
    });
  }
}