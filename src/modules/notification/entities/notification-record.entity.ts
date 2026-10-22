import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationEvent } from '../domain/notification-event.enum';
import { NotificationRecordStatus } from '../domain/notification-record-status.enum';

@Entity('notification_records')
@Index('IDX_notification_records_status_next_retry', ['status', 'nextRetryAt'])
export class NotificationRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationEvent, enumName: 'notification_records_event_enum' })
  event: NotificationEvent;

  @Column({ type: 'enum', enum: NotificationChannel, enumName: 'notification_records_channel_enum' })
  channel: NotificationChannel;

  @Column({ type: 'varchar', length: 320 })
  to: string;

  @Column({ type: 'enum', enum: NotificationRecordStatus, enumName: 'notification_records_status_enum' })
  status: NotificationRecordStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'provider_message_id', type: 'varchar', length: 256, nullable: true })
  providerMessageId: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
  nextRetryAt: Date | null;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 256, nullable: true, unique: true })
  idempotencyKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
