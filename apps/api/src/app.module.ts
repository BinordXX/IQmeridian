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

@Module({
  imports: [
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}