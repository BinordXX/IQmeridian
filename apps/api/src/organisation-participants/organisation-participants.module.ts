import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganisationParticipantsController } from './organisation-participants.controller';
import { OrganisationParticipantsService } from './organisation-participants.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [OrganisationParticipantsController],
  providers: [OrganisationParticipantsService],
})
export class OrganisationParticipantsModule {}
