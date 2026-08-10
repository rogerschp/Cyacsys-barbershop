import { Injectable } from '@nestjs/common';
import { ExpireSubscriptionsUseCase } from '../../subscription/use-cases/expire-subscriptions.use-case';

@Injectable()
export class ExpireAdminSubscriptionUseCase {
  constructor(
    private readonly expireSubscriptionsUseCase: ExpireSubscriptionsUseCase,
  ) {}

  async run(): Promise<{ expiredCount: number }> {
    return this.expireSubscriptionsUseCase.run();
  }
}
