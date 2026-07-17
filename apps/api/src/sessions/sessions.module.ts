import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { PsychometricsModule } from '../psychometrics/psychometrics.module';
import { VerificationTokensModule } from '../verification-tokens/verification-tokens.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    AuditModule,
    EmailModule,
    PsychometricsModule,
    VerificationTokensModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}