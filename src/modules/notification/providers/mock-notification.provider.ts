import { Injectable, Logger } from '@nestjs/common';
import { DispatchNotificationOptions } from '../domain/dispatch-notification.command';
import {
  INotificationProvider,
  PreparedNotification,
} from '../interfaces/notification-provider.interface';

@Injectable()
export class MockNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(MockNotificationProvider.name);

  async dispatch(
    prepared: PreparedNotification,
    options?: DispatchNotificationOptions,
  ): Promise<void> {
    void options;
    const lines = [
      '========================',
      'Notification',
      'Event:',
      prepared.event,
      'Channel:',
      prepared.channel,
      'To:',
      prepared.to,
      'Subject:',
      prepared.template.subject,
      'Body:',
      prepared.template.body,
      'Payload',
      JSON.stringify(prepared.payload, null, 2),
      '========================',
    ];
    this.logger.log(lines.join('\n'));
  }
}
