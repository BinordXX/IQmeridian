import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ItemBankController } from './item-bank.controller';
import { ItemBankService } from './item-bank.service';

@Module({
  imports: [AuditModule],
  controllers: [ItemBankController],
  providers: [ItemBankService],
  exports: [ItemBankService],
})
export class ItemBankModule {}
