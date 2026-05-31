import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';

@Module({
  imports: [AuditModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}