import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TenantSubscriptionEntity } from '../../modules/subscription/entities/tenant-subscription.entity';
import { SubscriptionStatus } from '../../modules/subscription/enums/subscription-status.enum';
import {
  CreateTenantSubscriptionData,
  ITenantSubscriptionRepository,
  UpdateTenantSubscriptionData,
} from '../../modules/subscription/interfaces/tenant-subscription-repository.interface';

@Injectable()
export class TenantSubscriptionRepository implements ITenantSubscriptionRepository {
  constructor(
    @InjectRepository(TenantSubscriptionEntity)
    private readonly repo: Repository<TenantSubscriptionEntity>,
  ) {}

  async create(
    data: CreateTenantSubscriptionData,
    manager?: EntityManager,
  ): Promise<TenantSubscriptionEntity> {
    const repository = manager
      ? manager.getRepository(TenantSubscriptionEntity)
      : this.repo;
    const entity = repository.create({
      tenantId: data.tenantId,
      planId: data.planId,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart ?? null,
      currentPeriodEnd: data.currentPeriodEnd ?? null,
      gracePeriodEnd: data.gracePeriodEnd ?? null,
      activatedBy: data.activatedBy ?? null,
    });
    return repository.save(entity);
  }

  async findByTenantId(
    tenantId: string,
  ): Promise<TenantSubscriptionEntity | null> {
    return this.repo.findOne({
      where: { tenantId },
      withDeleted: false,
    });
  }

  async findByTenantIdWithPlan(
    tenantId: string,
  ): Promise<TenantSubscriptionEntity | null> {
    return this.repo.findOne({
      where: { tenantId },
      relations: ['plan'],
      withDeleted: false,
    });
  }

  async update(
    id: string,
    data: UpdateTenantSubscriptionData,
    manager?: EntityManager,
  ): Promise<TenantSubscriptionEntity> {
    const repository = manager
      ? manager.getRepository(TenantSubscriptionEntity)
      : this.repo;
    const payload: Partial<TenantSubscriptionEntity> = {};
    if (data.planId !== undefined) payload.planId = data.planId;
    if (data.status !== undefined) payload.status = data.status;
    if (data.currentPeriodStart !== undefined) {
      payload.currentPeriodStart = data.currentPeriodStart;
    }
    if (data.currentPeriodEnd !== undefined) {
      payload.currentPeriodEnd = data.currentPeriodEnd;
    }
    if (data.gracePeriodEnd !== undefined) {
      payload.gracePeriodEnd = data.gracePeriodEnd;
    }
    if (data.cancelledAt !== undefined) payload.cancelledAt = data.cancelledAt;
    if (data.activatedBy !== undefined) payload.activatedBy = data.activatedBy;
    await repository.update({ id }, payload);
    const entity = await repository.findOne({
      where: { id },
      relations: ['plan'],
    });
    if (!entity) {
      throw new Error('TenantSubscription not found after update');
    }
    return entity;
  }

  async findExpiredActive(now: Date): Promise<TenantSubscriptionEntity[]> {
    return this.repo
      .createQueryBuilder('ts')
      .innerJoinAndSelect('ts.plan', 'plan')
      .where('ts.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
      })
      .andWhere('ts.currentPeriodEnd IS NOT NULL')
      .andWhere('ts.currentPeriodEnd < :now', { now })
      .andWhere('ts.deletedAt IS NULL')
      .getMany();
  }

  async findExpiredGracePeriod(now: Date): Promise<TenantSubscriptionEntity[]> {
    return this.repo
      .createQueryBuilder('ts')
      .innerJoinAndSelect('ts.plan', 'plan')
      .where('ts.status = :status', {
        status: SubscriptionStatus.GRACE_PERIOD,
      })
      .andWhere('ts.gracePeriodEnd IS NOT NULL')
      .andWhere('ts.gracePeriodEnd < :now', { now })
      .andWhere('ts.deletedAt IS NULL')
      .getMany();
  }
}
