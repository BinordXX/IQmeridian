import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ConsumerAssessmentsController } from './consumer-assessments.controller';
import { ConsumerAssessmentsService } from './consumer-assessments.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConsumerAssessmentsController],
  providers: [ConsumerAssessmentsService],
  exports: [ConsumerAssessmentsService],
})
export class ConsumerAssessmentsModule {}
