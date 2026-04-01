import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PricingService } from './pricing.service';
import { AdminQuotesController } from './admin-quotes.controller';
import { QuotesController } from './quotes.controller';
import { QuotesRepository } from './quotes.repository';
import { QuotesService } from './quotes.service';

@Module({
  imports: [AuthModule],
  controllers: [QuotesController, AdminQuotesController],
  providers: [QuotesRepository, QuotesService, PricingService],
})
export class QuotesModule {}
