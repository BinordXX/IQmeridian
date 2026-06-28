import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { ItemBankModule } from './item-bank/item-bank.module';
import { InvitationsModule } from './invitations/invitations.module';
import { SessionsModule } from './sessions/sessions.module';
import { ResponsesModule } from './responses/responses.module';
import { ScoringModule } from './scoring/scoring.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { InternalToolingModule } from './internal-tooling/internal-tooling.module';
import { PsychometricsModule } from './psychometrics/psychometrics.module';
import { AuthModule } from './auth/auth.module';
import { ConsumerAssessmentsModule } from './consumer-assessments/consumer-assessments.module';
import { ContactModule } from './contact/contact.module';
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RedisModule,
    UsersModule,
    OrganisationsModule,
    CampaignsModule,
    AssessmentsModule,
    ItemBankModule,
    InvitationsModule,
    SessionsModule,
    ResponsesModule,
    ScoringModule,
    ReportsModule,
    AuditModule,
    DiagnosticsModule,
    InternalToolingModule,
    PsychometricsModule,
    ConsumerAssessmentsModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
