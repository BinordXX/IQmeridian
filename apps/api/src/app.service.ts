import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getHello(): string {
    return 'IQMeridian API is running';
  }

  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;
    await this.redis.setValue('healthcheck', 'ok');
    const redisValue = await this.redis.getValue('healthcheck');

    return {
      status: 'ok',
      database: 'connected',
      redis: redisValue === 'ok' ? 'connected' : 'failed',
    };
  }
}