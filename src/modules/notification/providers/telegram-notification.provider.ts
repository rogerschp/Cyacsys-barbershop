import { Injectable, NotImplementedException } from '@nestjs/common';
import { DispatchNotificationOptions } from '../domain/dispatch-notification.command';
import {
  INotificationProvider,
  PreparedNotification,
} from '../interfaces/notification-provider.interface';

@Injectable()
export class TelegramNotificationProvider implements INotificationProvider {
  async dispatch(
    prepared: PreparedNotification,
    options?: DispatchNotificationOptions,
  ): Promise<void> {
    void prepared;
    void options;
    throw new NotImplementedException('TelegramNotificationProvider');
  }
}
