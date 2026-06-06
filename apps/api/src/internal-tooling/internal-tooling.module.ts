import { Module } from '@nestjs/common';

import { InternalToolingController } from './internal-tooling.controller';
import { InternalToolingService } from './internal-tooling.service';

@Module({
  controllers: [InternalToolingController],
  providers: [InternalToolingService],
})
export class InternalToolingModule {}
