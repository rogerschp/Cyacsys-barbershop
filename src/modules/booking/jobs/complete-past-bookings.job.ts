import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CompletePastBookingsUseCase } from '../use-cases/complete-past-bookings.use-case';

@Injectable()
export class CompletePastBookingsJob {
  private readonly logger = new Logger(CompletePastBookingsJob.name);

  constructor(
    private readonly completePastBookingsUseCase: CompletePastBookingsUseCase,
  ) {}

  @Cron('*/15 * * * *')
  async handleCompletePast() {
    this.logger.log('Running complete past bookings job');
    await this.completePastBookingsUseCase.run();
  }
}
