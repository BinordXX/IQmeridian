import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getCurrentUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisation: true,
      },
    });
  }

  getUsersByRole(role: UserRole) {
    return this.prisma.user.findMany({
      where: { role },
      include: { organisation: true },
    });
  }

  getUsersByOrganisation(organisationId: string) {
    return this.prisma.user.findMany({
      where: { organisationId },
    });
  }

  updateUserName(userId: string, name: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });
  }
}