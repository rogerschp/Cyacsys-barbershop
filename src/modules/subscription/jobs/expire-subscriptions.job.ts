import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExpireSubscriptionsUseCase } from '../use-cases/expire-subscriptions.use-case';

@Injectable()
export class ExpireSubscriptionsJob {
  private readonly logger = new Logger(ExpireSubscriptionsJob.name);

  constructor(
    private readonly expireSubscriptionsUseCase: ExpireSubscriptionsUseCase,
  ) {}

  @Cron('0 0 * * *')
  async handleExpiration() {
    this.logger.log('Running subscription expiration job');
    await this.expireSubscriptionsUseCase.run();
  }
}
