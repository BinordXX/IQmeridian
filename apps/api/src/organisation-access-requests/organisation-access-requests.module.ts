import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganisationAccessRequestsController } from './organisation-access-requests.controller';
import { OrganisationAccessRequestsService } from './organisation-access-requests.service';

@Module({
  imports: [AuditModule, PrismaModule],
  controllers: [OrganisationAccessRequestsController],
  providers: [OrganisationAccessRequestsService],
})
export class OrganisationAccessRequestsModule {}