import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [AuditModule, EmailModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
