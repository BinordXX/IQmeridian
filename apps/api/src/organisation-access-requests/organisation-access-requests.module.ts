import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationTokensModule } from '../verification-tokens/verification-tokens.module';
import { OrganisationAccessRequestsController } from './organisation-access-requests.controller';
import { OrganisationAccessRequestsService } from './organisation-access-requests.service';

@Module({
  imports: [AuditModule, EmailModule, PrismaModule, VerificationTokensModule],
  controllers: [OrganisationAccessRequestsController],
  providers: [OrganisationAccessRequestsService],
})
export class OrganisationAccessRequestsModule {}
