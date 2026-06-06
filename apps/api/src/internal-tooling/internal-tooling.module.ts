import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { InternalToolingController } from './internal-tooling.controller';
import { InternalToolingService } from './internal-tooling.service';

@Module({
  imports: [PrismaModule],
  controllers: [InternalToolingController],
  providers: [InternalToolingService],
})
export class InternalToolingModule {}
