import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VerificationTokenPurpose } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

type CreateVerificationTokenInput = {
  purpose: VerificationTokenPurpose;
  email: string;
  expiresAt: Date;
  subjectUserId?: string | null;
  organisationAdminInvitationId?: string | null;
  candidateInvitationId?: string | null;
  metadata?: unknown;
  revokeExisting?: boolean;
};

type FindUsableTokenInput = {
  rawToken: string;
  purpose: VerificationTokenPurpose;
};

type MarkTokenUsedInput = {
  tokenId: string;
};

type RevokeActiveTokensInput = {
  purpose: VerificationTokenPurpose;
  email?: string | null;
  subjectUserId?: string | null;
  organisationAdminInvitationId?: string | null;
  candidateInvitationId?: string | null;
  reason: string;
};

@Injectable()
export class VerificationTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async createToken(input: CreateVerificationTokenInput) {
    const email = this.normaliseEmail(input.email);

    if (!email) {
      throw new BadRequestException('Verification token email is required.');
    }

    if (input.expiresAt <= new Date()) {
      throw new BadRequestException(
        'Verification token expiry must be in the future.',
      );
    }

    if (input.revokeExisting ?? true) {
      await this.revokeActiveTokens({
        purpose: input.purpose,
        email,
        subjectUserId: input.subjectUserId,
        organisationAdminInvitationId: input.organisationAdminInvitationId,
        candidateInvitationId: input.candidateInvitationId,
        reason: 'replaced-by-new-token',
      });
    }

    const rawToken = this.generateRawToken();
    const tokenHash = this.hashRawToken(rawToken);

    const token = await this.prisma.verificationToken.create({
      data: {
        purpose: input.purpose,
        tokenHash,
        tokenLastFour: rawToken.slice(-4),
        email,
        subjectUserId: input.subjectUserId ?? null,
        organisationAdminInvitationId:
          input.organisationAdminInvitationId ?? null,
        candidateInvitationId: input.candidateInvitationId ?? null,
        expiresAt: input.expiresAt,
        metadata:
          input.metadata === undefined
            ? undefined
            : this.toJsonValue(input.metadata),
      },
    });

    return {
      rawToken,
      token,
    };
  }

  async findUsableToken(input: FindUsableTokenInput) {
    const tokenHash = this.hashRawToken(input.rawToken);

    const token = await this.prisma.verificationToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        subjectUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            organisationId: true,
          },
        },
        organisationAdminInvitation: {
          include: {
            organisation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        candidateInvitation: true,
      },
    });

    if (!token || token.purpose !== input.purpose) {
      throw new NotFoundException('Verification token is invalid.');
    }

    if (token.revokedAt) {
      throw new BadRequestException('Verification token has been revoked.');
    }

    if (token.usedAt) {
      throw new BadRequestException(
        'Verification token has already been used.',
      );
    }

    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired.');
    }

    return token;
  }

  async markTokenUsed(input: MarkTokenUsedInput) {
    const updatedToken = await this.prisma.verificationToken.updateMany({
      where: {
        id: input.tokenId,
        usedAt: null,
        revokedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (updatedToken.count !== 1) {
      throw new BadRequestException(
        'Verification token could not be marked as used.',
      );
    }

    return this.prisma.verificationToken.findUniqueOrThrow({
      where: {
        id: input.tokenId,
      },
    });
  }

  async revokeActiveTokens(input: RevokeActiveTokensInput) {
    const email = input.email ? this.normaliseEmail(input.email) : undefined;

    return this.prisma.verificationToken.updateMany({
      where: {
        purpose: input.purpose,
        email,
        subjectUserId: input.subjectUserId ?? undefined,
        organisationAdminInvitationId:
          input.organisationAdminInvitationId ?? undefined,
        candidateInvitationId: input.candidateInvitationId ?? undefined,
        usedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: input.reason,
      },
    });
  }

  getExpiryDate(minutesFromNow: number) {
    const expiresAt = new Date();

    expiresAt.setMinutes(expiresAt.getMinutes() + minutesFromNow);

    return expiresAt;
  }

  hashRawToken(rawToken: string) {
    const token = rawToken.trim();

    if (!token) {
      throw new BadRequestException('Verification token is required.');
    }

    return createHash('sha256').update(token).digest('hex');
  }

  private generateRawToken() {
    return randomBytes(32).toString('base64url');
  }

  private normaliseEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
