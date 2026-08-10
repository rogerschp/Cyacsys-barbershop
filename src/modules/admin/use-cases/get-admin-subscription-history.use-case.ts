import { Inject, Injectable } from '@nestjs/common';
import {
  ISubscriptionHistoryRepository,
  SUBSCRIPTION_HISTORY_REPOSITORY,
} from '../../subscription/interfaces/subscription-history-repository.interface';
import { AdminSubscriptionHistoryItemDto } from '../dto/admin-subscription-history-item.dto';
import { toAdminSubscriptionHistoryItemDto } from '../mappers/admin-subscription.mapper';

@Injectable()
export class GetAdminSubscriptionHistoryUseCase {
  constructor(
    @Inject(SUBSCRIPTION_HISTORY_REPOSITORY)
    private readonly subscriptionHistoryRepository: ISubscriptionHistoryRepository,
  ) {}

  async run(tenantId: string): Promise<AdminSubscriptionHistoryItemDto[]> {
    const history =
      await this.subscriptionHistoryRepository.findByTenantId(tenantId);
    return history.map(toAdminSubscriptionHistoryItemDto);
  }
}
