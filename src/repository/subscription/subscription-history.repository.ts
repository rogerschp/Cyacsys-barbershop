import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SubscriptionHistoryEntity } from '../../modules/subscription/entities/subscription-history.entity';
import {
  CreateSubscriptionHistoryData,
  ISubscriptionHistoryRepository,
} from '../../modules/subscription/interfaces/subscription-history-repository.interface';

@Injectable()
export class SubscriptionHistoryRepository implements ISubscriptionHistoryRepository {
  constructor(
    @InjectRepository(SubscriptionHistoryEntity)
    private readonly repo: Repository<SubscriptionHistoryEntity>,
  ) {}

  async create(
    data: CreateSubscriptionHistoryData,
    manager?: EntityManager,
  ): Promise<SubscriptionHistoryEntity> {
    const repository = manager
      ? manager.getRepository(SubscriptionHistoryEntity)
      : this.repo;
    const entity = repository.create({
      tenantId: data.tenantId,
      subscriptionId: data.subscriptionId,
      event: data.event,
      fromPlanId: data.fromPlanId ?? null,
      toPlanId: data.toPlanId ?? null,
      performedBy: data.performedBy,
    });
    return repository.save(entity);
  }

  async findByTenantId(tenantId: string): Promise<SubscriptionHistoryEntity[]> {
    return this.repo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      withDeleted: false,
    });
  }
}
