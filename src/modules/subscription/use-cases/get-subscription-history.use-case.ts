import { Inject, Injectable } from '@nestjs/common';
import { SubscriptionHistoryResponseDto } from '../dto/subscription-response.dto';
import {
  ISubscriptionHistoryRepository,
  SUBSCRIPTION_HISTORY_REPOSITORY,
} from '../interfaces/subscription-history-repository.interface';
import { toSubscriptionHistoryResponseDto } from '../mappers/subscription.mapper';

@Injectable()
export class GetSubscriptionHistoryUseCase {
  constructor(
    @Inject(SUBSCRIPTION_HISTORY_REPOSITORY)
    private readonly subscriptionHistoryRepository: ISubscriptionHistoryRepository,
  ) {}

  async run(tenantId: string): Promise<SubscriptionHistoryResponseDto[]> {
    const history =
      await this.subscriptionHistoryRepository.findByTenantId(tenantId);
    return history.map(toSubscriptionHistoryResponseDto);
  }
}
