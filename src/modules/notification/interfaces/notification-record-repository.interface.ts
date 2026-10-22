import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationEvent } from '../domain/notification-event.enum';
import { NotificationRecordStatus } from '../domain/notification-record-status.enum';
import { NotificationRecordEntity } from '../entities/notification-record.entity';

export interface CreateNotificationRecordData {
  event: NotificationEvent;
  channel: NotificationChannel;
  to: string;
  status: NotificationRecordStatus;
  errorMessage?: string | null;
  payload?: Record<string, unknown> | null;
  userId?: string | null;
  tenantId?: string | null;
  attempts?: number;
  providerMessageId?: string | null;
  sentAt?: Date | null;
  nextRetryAt?: Date | null;
  idempotencyKey?: string | null;
}

export interface INotificationRecordRepository {
  create(data: CreateNotificationRecordData): Promise<NotificationRecordEntity>;
  findByIdempotencyKey(key: string): Promise<NotificationRecordEntity | null>;
  findDueForRetry(limit: number, now: Date): Promise<NotificationRecordEntity[]>;
  update(
    id: string,
    data: Partial<CreateNotificationRecordData>,
  ): Promise<void>;
}

export const NOTIFICATION_RECORD_REPOSITORY = Symbol(
  'NOTIFICATION_RECORD_REPOSITORY',
);
