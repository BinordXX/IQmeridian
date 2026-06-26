import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { PsychometricsModule } from '../psychometrics/psychometrics.module';

@Module({
  imports: [AuditModule, PsychometricsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
