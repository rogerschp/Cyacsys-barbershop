import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  INotificationRecordRepository,
  NOTIFICATION_RECORD_REPOSITORY,
} from '../interfaces/notification-record-repository.interface';
import { DispatchNotificationUseCase } from './dispatch-notification.use-case';

/** Outbox: retenta PENDING/FAILED vencidos (backoff, máx. tentativas no dispatch). */
@Injectable()
export class NotificationProcessorJob {
  private readonly logger = new Logger(NotificationProcessorJob.name);
  constructor(
    @Inject(NOTIFICATION_RECORD_REPOSITORY)
    private readonly repo: INotificationRecordRepository,
    private readonly dispatch: DispatchNotificationUseCase,
    private readonly config: ConfigService,
  ) {}

  @Cron('*/30 * * * * *')
  async handle(): Promise<void> {
    if (this.config.get<string>('NOTIFICATION_PROCESSOR_ENABLED') === 'false')
      return;
    if (typeof this.repo.findDueForRetry !== 'function') return;
    const due = await this.repo.findDueForRetry(50, new Date());
    for (const record of due) {
      if ((record.attempts ?? 0) >= 3) continue;
      await this.dispatch.processRecord(record);
    }
    if (due.length) this.logger.log(`Processed ${due.length} notifications`);
  }
}
