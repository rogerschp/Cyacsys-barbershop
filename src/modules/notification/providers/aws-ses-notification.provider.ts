import { Injectable, NotImplementedException } from '@nestjs/common';
import { DispatchNotificationOptions } from '../domain/dispatch-notification.command';
import {
  INotificationProvider,
  PreparedNotification,
} from '../interfaces/notification-provider.interface';

@Injectable()
export class AwsSesNotificationProvider implements INotificationProvider {
  async dispatch(
    _prepared: PreparedNotification,
    _options?: DispatchNotificationOptions,
  ): Promise<void> {
    throw new NotImplementedException('AwsSesNotificationProvider');
  }
}
