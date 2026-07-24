import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationRecordEntity } from '../../modules/notification/entities/notification-record.entity';
import {
  CreateNotificationRecordData,
  INotificationRecordRepository,
} from '../../modules/notification/interfaces/notification-record-repository.interface';

@Injectable()
export class NotificationRecordRepository
  implements INotificationRecordRepository
{
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
    });
    return this.repo.save(entity);
  }
}
