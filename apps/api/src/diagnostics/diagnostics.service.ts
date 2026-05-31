import { Injectable } from '@nestjs/common';
import { FormItemMappingStatus, ItemStatus } from '@prisma/client';
import * as net from 'node:net';
import { PrismaService } from '../prisma/prisma.service';

type DependencyStatus = 'UP' | 'DOWN' | 'DEGRADED';

@Injectable()
export class DiagnosticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDiagnostics() {
    const [database, redis, domain] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDomainReadiness(),
    ]);

    const overallStatus = this.resolveOverallStatus([
      database.status,
      redis.status,
      domain.status,
    ]);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV ?? 'development',
        port: process.env.PORT ?? '3001',
        databaseUrlDefined: Boolean(process.env.DATABASE_URL),
        redisHost: process.env.REDIS_HOST ?? 'localhost',
        redisPort: Number(process.env.REDIS_PORT ?? 6379),
      },
      dependencies: {
        database,
        redis,
      },
      domain,
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'UP' as DependencyStatus,
        message: 'Database connection is available',
      };
    } catch (error) {
      return {
        status: 'DOWN' as DependencyStatus,
        message: 'Database connection failed',
        detail:
          error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  private async checkRedis() {
    const host = process.env.REDIS_HOST ?? 'localhost';
    const port = Number(process.env.REDIS_PORT ?? 6379);

    const isReachable = await this.canOpenTcpConnection(host, port, 1500);

    if (isReachable) {
      return {
        status: 'UP' as DependencyStatus,
        message: 'Redis TCP port is reachable',
        host,
        port,
      };
    }

    return {
      status: 'DOWN' as DependencyStatus,
      message: 'Redis TCP port is not reachable',
      host,
      port,
    };
  }

  private async checkDomainReadiness() {
    try {
      const [
        activeFormCount,
        activeItemCount,
        activeMappedItemCount,
        scorableMappedItemCount,
      ] = await this.prisma.$transaction([
        this.prisma.assessmentForm.count({
          where: {
            isActive: true,
          },
        }),
        this.prisma.item.count({
          where: {
            status: ItemStatus.ACTIVE,
          },
        }),
        this.prisma.formItemMapping.count({
          where: {
            status: FormItemMappingStatus.ACTIVE,
          },
        }),
        this.prisma.formItemMapping.count({
          where: {
            status: FormItemMappingStatus.ACTIVE,
            item: {
              status: ItemStatus.ACTIVE,
            },
          },
        }),
      ]);

      const scoringReady =
        activeFormCount > 0 &&
        activeItemCount > 0 &&
        activeMappedItemCount > 0 &&
        scorableMappedItemCount > 0;

      return {
        status: scoringReady
          ? ('UP' as DependencyStatus)
          : ('DEGRADED' as DependencyStatus),
        message: scoringReady
          ? 'Domain dependencies are ready for MVP scoring workflow'
          : 'Domain dependencies are incomplete for full scoring workflow',
        checks: {
          activeFormCount,
          activeItemCount,
          activeMappedItemCount,
          scorableMappedItemCount,
          scoringReady,
        },
      };
    } catch (error) {
      return {
        status: 'DOWN' as DependencyStatus,
        message: 'Domain readiness check failed',
        detail:
          error instanceof Error
            ? error.message
            : 'Unknown domain readiness error',
      };
    }
  }

  private canOpenTcpConnection(
    host: string,
    port: number,
    timeoutMs: number,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();

      const finish = (result: boolean) => {
        socket.removeAllListeners();
        socket.destroy();
        resolve(result);
      };

      socket.setTimeout(timeoutMs);

      socket.once('connect', () => finish(true));
      socket.once('timeout', () => finish(false));
      socket.once('error', () => finish(false));

      socket.connect(port, host);
    });
  }

  private resolveOverallStatus(statuses: DependencyStatus[]) {
    if (statuses.includes('DOWN')) {
      return 'DOWN';
    }

    if (statuses.includes('DEGRADED')) {
      return 'DEGRADED';
    }

    return 'UP';
  }
}