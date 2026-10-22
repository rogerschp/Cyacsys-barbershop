import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { NotificationRecordStatus } from '../../modules/notification/domain/notification-record-status.enum';
import { NotificationRecordEntity } from '../../modules/notification/entities/notification-record.entity';
import {
  CreateNotificationRecordData,
  INotificationRecordRepository,
} from '../../modules/notification/interfaces/notification-record-repository.interface';

@Injectable()
export class NotificationRecordRepository implements INotificationRecordRepository {
  constructor(
    @InjectRepository(NotificationRecordEntity)
    private readonly repo: Repository<NotificationRecordEntity>,
  ) {}

  async create(
    data: CreateNotificationRecordData,
  ): Promise<NotificationRecordEntity> {
    const entity = this.repo.create({
      event: data.event,
      channel: data.channel,
      to: data.to,
      status: data.status,
      errorMessage: data.errorMessage ?? null,
      payload: data.payload ?? null,
      userId: data.userId ?? null,
      tenantId: data.tenantId ?? null,
      attempts: data.attempts ?? 0,
      providerMessageId: data.providerMessageId ?? null,
      sentAt: data.sentAt ?? null,
      nextRetryAt: data.nextRetryAt ?? null,
      idempotencyKey: data.idempotencyKey ?? null,
    });
    return this.repo.save(entity);
  }

  async findByIdempotencyKey(
    key: string,
  ): Promise<NotificationRecordEntity | null> {
    return this.repo.findOne({ where: { idempotencyKey: key } });
  }

  async findDueForRetry(
    limit: number,
    now: Date,
  ): Promise<NotificationRecordEntity[]> {
    return this.repo.find({
      where: [
        {
          status: NotificationRecordStatus.PENDING,
          nextRetryAt: LessThanOrEqual(now),
        },
        {
          status: NotificationRecordStatus.FAILED,
          nextRetryAt: LessThanOrEqual(now),
        },
      ],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async update(
    id: string,
    data: Partial<CreateNotificationRecordData>,
  ): Promise<void> {
    await this.repo.update(id, {
      ...data,
    } as Partial<NotificationRecordEntity>);
  }
}
