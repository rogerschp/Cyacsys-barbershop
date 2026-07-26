import { Inject, Injectable } from '@nestjs/common';
import {
  DispatchNotificationCommand,
  DispatchNotificationOptions,
} from '../domain/dispatch-notification.command';
import { NotificationRecordStatus } from '../domain/notification-record-status.enum';
import {
  INotificationProvider,
  NOTIFICATION_PROVIDER,
  PreparedNotification,
} from '../interfaces/notification-provider.interface';
import {
  INotificationRecordRepository,
  NOTIFICATION_RECORD_REPOSITORY,
} from '../interfaces/notification-record-repository.interface';
import { NotificationRouter } from '../routing/notification.router';
import { TemplateRenderer } from '../templates/template.renderer';

@Injectable()
export class DispatchNotificationUseCase {
  constructor(
    private readonly router: NotificationRouter,
    private readonly templateRenderer: TemplateRenderer,
    @Inject(NOTIFICATION_PROVIDER)
    private readonly provider: INotificationProvider,
    @Inject(NOTIFICATION_RECORD_REPOSITORY)
    private readonly recordRepository: INotificationRecordRepository,
  ) {}

  async run(
    command: DispatchNotificationCommand,
    options?: DispatchNotificationOptions,
  ): Promise<void> {
    const channels = this.router.resolve(command.event);

    for (const channel of channels) {
      const template = this.templateRenderer.render({
        event: command.event,
        channel,
        payload: command.payload,
      });

      const prepared: PreparedNotification = {
        event: command.event,
        channel,
        to: command.to,
        template,
        payload: command.payload,
      };

      try {
        await this.provider.dispatch(prepared, options);
        await this.recordRepository.create({
          event: command.event,
          channel,
          to: command.to,
          status: NotificationRecordStatus.SENT,
          payload: command.payload,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown notification error';
        await this.recordRepository.create({
          event: command.event,
          channel,
          to: command.to,
          status: NotificationRecordStatus.FAILED,
          errorMessage: message,
          payload: command.payload,
        });
        throw error;
      }
    }
  }
}
