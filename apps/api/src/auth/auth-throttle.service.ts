import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthRateLimitAction } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthThrottleService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAllowed(input: {
    action: AuthRateLimitAction;
    identifier: string;
    maxAttempts: number;
    windowSeconds: number;
  }) {
    const keyHash = this.hashKey(input.identifier);
    const since = new Date(Date.now() - input.windowSeconds * 1000);

    const attempts = await this.prisma.authRateLimitEvent.count({
      where: {
        action: input.action,
        keyHash,
        success: false,
        createdAt: {
          gte: since,
        },
      },
    });

    if (attempts >= input.maxAttempts) {
      throw new HttpException(
        'Too many attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async record(input: {
    action: AuthRateLimitAction;
    identifier: string;
    success: boolean;
  }) {
    await this.prisma.authRateLimitEvent.create({
      data: {
        action: input.action,
        keyHash: this.hashKey(input.identifier),
        success: input.success,
      },
    });
  }

  private hashKey(identifier: string) {
    const pepper =
      process.env.AUTH_RATE_LIMIT_PEPPER ??
      process.env.PASSWORD_PEPPER ??
      'iqmeridian-auth-rate-limit';

    return createHash('sha256')
      .update(`${pepper}:${identifier.trim().toLowerCase()}`)
      .digest('hex');
  }
}
