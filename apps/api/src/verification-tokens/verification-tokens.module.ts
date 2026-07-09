import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { VerificationTokensService } from './verification-tokens.service';

@Module({
  imports: [PrismaModule],
  providers: [VerificationTokensService],
  exports: [VerificationTokensService],
})
export class VerificationTokensModule {}