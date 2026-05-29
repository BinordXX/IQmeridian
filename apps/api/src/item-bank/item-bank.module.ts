import { Module } from '@nestjs/common';
import { ItemBankController } from './item-bank.controller';
import { ItemBankService } from './item-bank.service';

@Module({
  controllers: [ItemBankController],
  providers: [ItemBankService],
  exports: [ItemBankService],
})
export class ItemBankModule {}