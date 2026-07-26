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
}

export interface INotificationRecordRepository {
  create(data: CreateNotificationRecordData): Promise<NotificationRecordEntity>;
}

export const NOTIFICATION_RECORD_REPOSITORY = Symbol(
  'NOTIFICATION_RECORD_REPOSITORY',
);
